const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

// ───── IN-MEMORY CACHE ─────
const spamMap = new Map(); // Key: userId, Value: { count, lastMsg }
const MENTIONS_LIMIT = 5;

// ───── BAD WORDS LIST ─────
const ORIGINAL_BAD_WORDS = [
    "nigger", "faggot", "chink", "kike", "otha", "tranny",
    "punda", "thevidiya", "ommala", "poolu", "koothi", "thevidiyaaaa",
    "fuck", "shit", "bitch", "ass", "damn", "nude", "porn", "sex", "xxx", "onlyfans",
    "kys", "killyourself", "goddie", "youshoulddie", "ihateyou",
    "whore", "slut", "cunt", "rape", "pedo"
];

// ───── SCAM LINKS ─────
const SCAM_KEYWORDS = [
    "freenitro", "discordgift", "steamgift", "claimnow", "clickhere", "bitly", "tinyurl",
    "nitrogift", "freegift", "airdrop", "getfree", "getnitro", "t.me/", "paypal.me", "grabify"
];

async function checkAutomod(message, client) {
    if (!message.guild || message.author.bot) return;

    // 1. BYPASS CHECKS
    const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
    const isBotOwner = message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID;
    const isServerOwner = message.author.id === message.guild.ownerId;

    // Extra Owners
    const OWNERS_DB = path.join(__dirname, "../data/owners.json");
    let extraOwners = [];
    if (fs.existsSync(OWNERS_DB)) {
        try {
            const db = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
            if (db[message.guild.id]) extraOwners = db[message.guild.id].map(o => typeof o === 'string' ? o : o.id);
        } catch (e) { }
    }
    const isOwner = isBotOwner || isServerOwner || extraOwners.includes(message.author.id);
    if (isOwner) return;

    // Whitelist
    const WHITELIST_DB = path.join(__dirname, "../data/whitelist.json");
    const ANTINUKE_DB = path.join(__dirname, "../data/antinuke.json");
    let whitelist = [];
    if (fs.existsSync(WHITELIST_DB)) {
        try {
            const wlData = JSON.parse(fs.readFileSync(WHITELIST_DB, "utf8"));
            const guildWL = wlData[message.guild.id];
            if (Array.isArray(guildWL)) whitelist.push(...guildWL);
            else if (guildWL && typeof guildWL === 'object') whitelist.push(...Object.keys(guildWL));
        } catch (e) { }
    }
    if (fs.existsSync(ANTINUKE_DB)) {
        try {
            const anData = JSON.parse(fs.readFileSync(ANTINUKE_DB, "utf8"));
            if (anData[message.guild.id]?.whitelisted) whitelist.push(...anData[message.guild.id].whitelisted);
        } catch (e) { }
    }
    if (whitelist.includes(message.author.id)) return;

    // ───── CONFIGURATION SYNC ─────
    const AUTOMOD_DB = path.join(__dirname, "../data/automod.json");
    let settings = { enabled: true, antiLinks: true, antiSpam: true, antiBadWords: true, antiMassMentions: true, antiCaps: false };
    
    if (fs.existsSync(AUTOMOD_DB)) {
        try {
            const db = JSON.parse(fs.readFileSync(AUTOMOD_DB, "utf8"));
            const guildConfig = db[message.guild.id];
            if (guildConfig) {
                // Map new "modules" format
                if (guildConfig.modules) {
                    settings.antiLinks = guildConfig.modules.links ?? true;
                    settings.antiSpam = guildConfig.modules.spam ?? true;
                    settings.antiBadWords = guildConfig.modules.nsfw ?? true;
                    settings.antiMassMentions = guildConfig.modules.mentions ?? true;
                    settings.antiCaps = guildConfig.modules.caps ?? false;
                }
                // Merge everything else (enabled, punishment, etc.)
                settings = { ...settings, ...guildConfig };
            }
        } catch (e) { }
    }

    if (settings.enabled === false) return;

    const content = message.content.trim();
    if (!content) return;

    // ───── NORMALIZATION ─────
    const cleanContent = content.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ""); 
    
    // For bad words (strict removal of spaces/chars)
    const normalized = cleanContent
        .replace(/[0oO]/g, "o")
        .replace(/[1iI!lL|]/g, "i")
        .replace(/[3eE]/g, "e")
        .replace(/[4aA@]/g, "a")
        .replace(/[5sS$]/g, "s")
        .replace(/[7tT]/g, "t")
        .replace(/[8bB]/g, "b")
        .replace(/[\W_]+/g, "");

    // ───── 2. ANTI-LINKS / INVITES ─────
    if (settings.antiLinks) {
        const hasInvite = content.includes("discord.gg/") || content.includes("discord.com/invite/");
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/ig;
        const hasLink = linkRegex.test(content);
        
        if (hasInvite || hasLink) {
            const allowedDomains = ["tenor.com", "giphy.com", "discord.com", "discord.gg", "youtube.com", "spotify.com", "twitch.tv"];
            const isAllowed = allowedDomains.some(domain => content.includes(domain));
            
            // Re-test because regex is stateful if 'g' flag is used
            const finalLinkCheck = /(https?:\/\/[^\s]+|www\.[^\s]+)/ig.test(content);
            if ((finalLinkCheck && !isAllowed) || hasInvite) {
                return punishViolation(message, "Link/Invite", "unauthorized link or server invite");
            }
        }
    }

    // ───── 3. ANTI-BAD WORDS / SCAMS ─────
    if (settings.antiBadWords) {
        const wordsInContent = content.toLowerCase().split(/\s+/);
        let foundWord = ORIGINAL_BAD_WORDS.find(word => normalized.includes(word) || wordsInContent.includes(word));
        let foundScam = SCAM_KEYWORDS.find(word => cleanContent.includes(word));

        if (foundWord || foundScam) {
            return punishViolation(message, foundScam ? "Scam" : "Profanity", foundScam ? `Scam Link Pattern` : `Profanity (${foundWord})`);
        }
    }

    // ───── 4. ANTI-MASS MENTIONS ─────
    if (settings.antiMassMentions) {
        const mentionCount = (message.mentions.users.size || 0) + (message.mentions.roles.size || 0);
        if (mentionCount >= MENTIONS_LIMIT) {
            return punishViolation(message, "Mass Mention", "excessive pings");
        }
    }

    // ───── 5. ANTI-SPAM ─────
    if (settings.antiSpam) {
        const userId = message.author.id;
        const now = Date.now();
        const userData = spamMap.get(userId) || { count: 0, lastMsg: now };

        if (now - userData.lastMsg < 2000) {
            userData.count++;
        } else {
            userData.count = 1;
        }
        userData.lastMsg = now;
        spamMap.set(userId, userData);

        if (userData.count >= 5) {
            spamMap.delete(userId);
            return punishViolation(message, "Spam", "message flooding");
        }
    }

    // ───── 6. ANTI-CAPS ─────
    if (settings.antiCaps) {
        if (content.length > 20) {
            const caps = content.replace(/[^A-Z]/g, "").length;
            const ratio = caps / content.length;
            if (ratio > 0.7) {
                return punishViolation(message, "Caps", "excessive capitalization");
            }
        }
    }
}

async function punishViolation(message, type, reason) {
    try {
        if (message.deletable) await message.delete().catch(() => { });

        const isStaff = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) || message.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (isStaff && message.member.manageable) {
            // STAFF PUNISHMENT (Role wipe)
            await message.member.roles.set([], `AutoMod Violation: ${type}`).catch(() => { });
            
            const V2 = global.V2 || require("./v2Utils");
            await message.member.send({
                components: [V2.container([
                    V2.heading("🚨 SECURITY REVOKED", 2),
                    V2.text(`**Violation in ${message.guild.name}.**\nYour roles were stripped for ${reason}.`),
                    V2.text(`*Authority does not exempt one from security protocols.*`)
                ], "#FF0000")]
            }).catch(() => { });

            return handleViolation(message, type, reason, "Roles Stripped (Recursive Accountability)");
        }

        // Standard Timeout for non-staff
        if (message.member.moderatable) {
            await message.member.timeout(10 * 60 * 1000, `AutoMod: ${reason}`).catch(() => { });
            return handleViolation(message, type, reason, "10m Isolation");
        }

        return handleViolation(message, type, reason, "Warning Issued (Shield Active)");

    } catch (e) {
        console.error("Punishment Error:", e);
    }
}

async function handleViolation(message, type, reason, actionTaken) {
    try {
        const V2 = global.V2 || require("./v2Utils");

        // 1. PUBLIC ALERT
        const alert = V2.container([
            V2.section([
                V2.heading(`⚠️ ${type} BLOCKED`, 2),
                V2.text(`**${message.author.username}**, violation detected.\n> **Nature:** ${reason}\n> **Enforcement:** ${actionTaken}`)
            ], message.client.user.displayAvatarURL())
        ], "#0099FF");

        await message.channel.send({ content: `${message.author}`, components: [alert] }).then(m => {
            setTimeout(() => m.delete().catch(() => { }), 10000);
        }).catch(() => { });

        // 2. LOGGING
        const log = V2.container([
            V2.heading("🛡️ AUTO-MOD LOG", 2),
            V2.text(`**User:** ${message.author} (\`${message.author.id}\`)`),
            V2.text(`**Channel:** ${message.channel}`),
            V2.separator(),
            V2.text(`**Type:** ${type}\n**Reason:** ${reason}\n**Action:** ${actionTaken}`),
            V2.text(`**Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`)
        ], "#FF8C00");

        const logChannel = message.guild.channels.cache.find(c => c.name === "🛡-security-alerts" || c.name === "automod-logs" || c.name === "mod-logs");
        if (logChannel) logChannel.send({ components: [log] }).catch(() => { });

    } catch (e) {
        console.error("Log Error:", e);
    }
}

module.exports = { checkAutomod };
