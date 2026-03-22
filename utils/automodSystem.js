/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║        interX ◆ HYPER AUTOMOD ENGINE v5.0 SOVEREIGN                ║
 * ║  AI-grade message scanning: instant delete + escalating punishment  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

"use strict";

const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs   = require("fs");
const path = require("path");

// ── PATHS ──────────────────────────────────────────────────────────────────
const DATA        = path.join(__dirname, "../data");
const OWNERS_DB   = path.join(DATA, "owners.json");
const WHITELIST_DB = path.join(DATA, "whitelist.json");
const ANTINUKE_DB = path.join(DATA, "antinuke.json");
const AUTOMOD_DB  = path.join(DATA, "automod.json");

// ── VIOLATION STRIKE TRACKER ──────────────────────────────────────────────
// Key = `${guildId}:${userId}` → { strikes, lastAt }
const STRIKE_MAP = new Map();
const STRIKE_WINDOW = 60_000; // 1-minute window for escalation
const MAX_STRIKES   = 3;      // Auto-ban after 3 strikes

// ── SPAM TRACKER ──────────────────────────────────────────────────────────
// Key = `${guildId}:${userId}` → { count, firstAt, lastContent }
const SPAM_MAP = new Map();
const SPAM_WINDOW  = 3_000;  // 3s rolling window
const SPAM_LIMIT   = 5;      // 5 identical/rapid messages = spam

// ── RAID TRACKING (guild-level) ───────────────────────────────────────────
// Key = guildId → { joins: [timestamps] }
const RAID_MAP = new Map();
const RAID_WINDOW = 10_000; // 10s window
const RAID_LIMIT  = 8;      // 8 joins in 10s = raid

// ── MENTION SPAM ──────────────────────────────────────────────────────────
const MENTION_LIMIT = 5;

// ── BAD WORDS (expanded + leet-speak normalized) ──────────────────────────
const BAD_WORDS = [
    "nigger","nigga","faggot","chink","kike","tranny","spic","gook",
    "punda","thevidiya","ommala","poolu","koothi","otha",
    "fuck","shit","bitch","ass","damn","whore","slut","cunt","rape","pedo",
    "nude","porn","sex","xxx","onlyfans","nudes","sextape",
    "kys","killyourself","youshoulddie","ihateyou","kill yourself",
    "die bitch","go die","end yourself","neck yourself"
];

// ── SCAM / PHISHING PATTERNS ──────────────────────────────────────────────
const SCAM_PATTERNS = [
    /free\s*nitro/i, /discord\s*gift/i, /steam\s*gift/i,
    /claim\s*now/i, /click\s*here/i, /bit\.ly/i, /tinyurl/i,
    /nitro\s*gift/i, /free\s*gift/i, /airdrop/i, /get\s*free/i,
    /t\.me\//i, /paypal\.me/i, /grabify/i, /iplogger/i,
    /verify.*discord/i, /discord.*verify/i, /free.*boost/i,
    /gift.*nitro/i, /nitro.*free/i
];

// ── INVITE LINK PATTERN ──────────────────────────────────────────────────
const INVITE_REGEX = /discord\.(gg|com\/invite)\/[a-zA-Z0-9-]+/i;
const URL_REGEX    = /(https?:\/\/[^\s]+|www\.[^\s]+)/ig;
const ALLOWED_DOMAINS = ["tenor.com","giphy.com","discord.com","youtube.com","youtu.be","spotify.com","twitch.tv","imgur.com"];

// ── ZALGO / UNICODE SPAM ──────────────────────────────────────────────────
const ZALGO_REGEX  = /[\u0300-\u036f\u0489]/g;
const ZALGO_LIMIT  = 15; // If more than 15 zalgo chars → flag

// ── CACHE HELPERS ─────────────────────────────────────────────────────────
let _ownersCache = null, _ownersCacheAt = 0;
function getOwners() {
    if (Date.now() - _ownersCacheAt < 5_000 && _ownersCache) return _ownersCache;
    try { _ownersCache = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8")); }
    catch { _ownersCache = {}; }
    _ownersCacheAt = Date.now();
    return _ownersCache;
}

let _wlCache = null, _wlCacheAt = 0;
function getWhitelist() {
    if (Date.now() - _wlCacheAt < 5_000 && _wlCache) return _wlCache;
    try { _wlCache = JSON.parse(fs.readFileSync(WHITELIST_DB, "utf8")); }
    catch { _wlCache = {}; }
    _wlCacheAt = Date.now();
    return _wlCache;
}

let _amCache = null, _amCacheAt = 0;
function getAutomodConfig(guildId) {
    if (Date.now() - _amCacheAt < 5_000 && _amCache) return _amCache[guildId] || {};
    try { _amCache = JSON.parse(fs.readFileSync(AUTOMOD_DB, "utf8")); }
    catch { _amCache = {}; }
    _amCacheAt = Date.now();
    return _amCache[guildId] || {};
}

// ── NORMALIZATION ─────────────────────────────────────────────────────────
function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[0oO@]/g, "o")
        .replace(/[1iI!|lL]/g, "i")
        .replace(/[3eE]/g, "e")
        .replace(/[4aA]/g, "a")
        .replace(/[5sS$]/g, "s")
        .replace(/[7tT]/g, "t")
        .replace(/[8bB]/g, "b")
        .replace(/[$€£¥]/g, "s")
        .replace(/[\W_]+/g, "");
}

// ── STRIKE SYSTEM ─────────────────────────────────────────────────────────
function addStrike(guildId, userId) {
    const key = `${guildId}:${userId}`;
    const now  = Date.now();
    let d = STRIKE_MAP.get(key) || { strikes: 0, lastAt: now };
    if (now - d.lastAt > STRIKE_WINDOW) d.strikes = 0;
    d.strikes++;
    d.lastAt = now;
    STRIKE_MAP.set(key, d);
    return d.strikes;
}

// ── MAIN AUTOMOD FUNCTION ─────────────────────────────────────────────────
async function checkAutomod(message, client) {
    if (!message.guild || message.author.bot) return;
    if (!message.channel || !message.member) return;

    const guild  = message.guild;
    const author = message.author;
    const member = message.member;

    // ── BYPASS CHECKS ────────────────────────────────────────────────────
    const { BOT_OWNER_ID } = require("../config");
    if (author.id === BOT_OWNER_ID) return;
    if (author.id === guild.ownerId) return;

    // Extra Owners bypass
    const owners = getOwners();
    const extraOwners = (owners[guild.id] || []).map(o => typeof o === "string" ? o : o.id);
    if (extraOwners.includes(author.id)) return;

    // Whitelist bypass
    const wl   = getWhitelist();
    const gWL  = wl[guild.id];
    if (gWL) {
        const wled = Array.isArray(gWL) ? gWL.includes(author.id) : !!gWL[author.id];
        if (wled) return;
    }

    // ── LOAD CONFIG ───────────────────────────────────────────────────────
    const cfg = getAutomodConfig(guild.id);
    const settings = {
        enabled:          cfg.enabled          !== false,
        antiLinks:        cfg.modules?.links   !== false,
        antiInvites:      cfg.modules?.invites !== false,
        antiSpam:         cfg.modules?.spam    !== false,
        antiBadWords:     cfg.modules?.nsfw    !== false,
        antiMassMentions: cfg.modules?.mentions !== false,
        antiCaps:         cfg.modules?.caps    ?? false,
        antiZalgo:        cfg.modules?.zalgo   ?? true,
        antiScam:         cfg.modules?.scam    !== false,
        antiRepeat:       cfg.modules?.repeat  ?? true,
    };
    if (!settings.enabled) return;

    const content   = message.content;
    const clean     = content.toLowerCase().trim();
    const norm      = normalize(content);

    // ── 1. ANTI-ZALGO ────────────────────────────────────────────────────
    if (settings.antiZalgo) {
        const zalgoCount = (content.match(ZALGO_REGEX) || []).length;
        if (zalgoCount > ZALGO_LIMIT) {
            return handleViolation(message, client, "Zalgo/Unicode Spam", `Excessive combining characters (${zalgoCount} detected)`, "delete");
        }
    }

    // ── 2. ANTI-SCAM / PHISHING ──────────────────────────────────────────
    if (settings.antiScam) {
        const foundScam = SCAM_PATTERNS.find(p => p.test(clean));
        if (foundScam) {
            return handleViolation(message, client, "Phishing/Scam", `Scam link or phishing pattern detected`, "timeout");
        }
    }

    // ── 3. ANTI-INVITE / ANTI-LINKS ──────────────────────────────────────
    if (settings.antiInvites && INVITE_REGEX.test(clean)) {
        return handleViolation(message, client, "Discord Invite", "Unauthorized server invite link", "delete");
    }
    if (settings.antiLinks) {
        const hasLink = URL_REGEX.test(content);
        URL_REGEX.lastIndex = 0; // Reset stateful regex
        if (hasLink) {
            const allowed = ALLOWED_DOMAINS.some(d => clean.includes(d));
            if (!allowed) {
                return handleViolation(message, client, "Unauthorized Link", "External link in message", "delete");
            }
        }
    }

    // ── 4. ANTI-BAD WORDS ────────────────────────────────────────────────
    if (settings.antiBadWords) {
        const found = BAD_WORDS.find(w => norm.includes(normalize(w)) || clean.split(/\s+/).includes(w));
        if (found) {
            return handleViolation(message, client, "Profanity", `Blocked word detected`, "timeout");
        }
    }

    // ── 5. ANTI-MASS MENTION ─────────────────────────────────────────────
    if (settings.antiMassMentions) {
        const totalMentions = (message.mentions.users.size || 0) + (message.mentions.roles.size || 0);
        if (totalMentions >= MENTION_LIMIT) {
            return handleViolation(message, client, "Mass Mention", `Pinged ${totalMentions} users/roles at once`, "timeout");
        }
        // @everyone / @here detection
        if (message.mentions.everyone && !member.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
            return handleViolation(message, client, "@everyone Abuse", "Attempted to ping everyone without permission", "timeout");
        }
    }

    // ── 6. ANTI-CAPS ─────────────────────────────────────────────────────
    if (settings.antiCaps && content.length > 20) {
        const caps  = (content.match(/[A-Z]/g) || []).length;
        const ratio = caps / content.length;
        if (ratio > 0.75) {
            return handleViolation(message, client, "Excessive Caps", `${Math.round(ratio * 100)}% capitalization`, "delete");
        }
    }

    // ── 7. ANTI-SPAM (rapid messages) ────────────────────────────────────
    if (settings.antiSpam) {
        const sKey = `${guild.id}:${author.id}`;
        const now  = Date.now();
        let sd = SPAM_MAP.get(sKey) || { count: 0, firstAt: now, lastContent: "" };
        if (now - sd.firstAt > SPAM_WINDOW) { sd = { count: 0, firstAt: now, lastContent: content }; }
        sd.count++;
        sd.lastContent = content;
        SPAM_MAP.set(sKey, sd);
        if (sd.count >= SPAM_LIMIT) {
            SPAM_MAP.delete(sKey);
            return handleViolation(message, client, "Message Spam", `Sent ${sd.count} messages in < ${SPAM_WINDOW / 1000}s`, "timeout");
        }
    }

    // ── 8. ANTI-REPEAT (duplicate message flood) ─────────────────────────
    if (settings.antiRepeat) {
        const rKey = `${guild.id}:${author.id}`;
        const sd   = SPAM_MAP.get(rKey);
        if (sd && sd.lastContent === content && sd.count >= 2) {
            return handleViolation(message, client, "Repeat Spam", "Copy-pasted identical messages multiple times", "timeout");
        }
    }
}

// ── VIOLATION HANDLER ─────────────────────────────────────────────────────
async function handleViolation(message, client, type, reason, baseAction) {
    try {
        const guild  = message.guild;
        const member = message.member;
        const author = message.author;

        // 1. Delete the offending message
        if (message.deletable) await message.delete().catch(() => {});

        // 2. Determine strike-based action
        const strikes = addStrike(guild.id, author.id);
        let action    = baseAction;
        let duration  = "10 minutes";

        if (strikes >= MAX_STRIKES) {
            action   = "ban";
            duration = "Permanent";
        } else if (strikes === 2) {
            action   = "timeout-long";
            duration = "1 hour";
        }

        // 3. Execute punishment
        let actionTaken = "Warning Issued";
        const isStaff   = member?.permissions?.has(PermissionsBitField.Flags.ManageMessages)
            || member?.permissions?.has(PermissionsBitField.Flags.Administrator);

        if (action === "ban" && member?.bannable) {
            await member.ban({ reason: `[interX AutoMod] 3-Strike Rule: ${reason}` });
            actionTaken = "🔨 Permanent Ban (3-Strike Rule)";

        } else if (action === "timeout-long" && member?.moderatable) {
            await member.timeout(3_600_000, `[interX AutoMod] ${reason}`); // 1 hour
            actionTaken = "⏱️ 1-Hour Timeout (Strike 2)";

        } else if (action === "timeout" && member?.moderatable) {
            await member.timeout(600_000, `[interX AutoMod] ${reason}`); // 10 min
            actionTaken = "⏱️ 10-Minute Timeout";

        } else if (isStaff && member?.manageable) {
            try {
                await member.roles.set([], `[interX AutoMod] Role Strip: ${reason}`);
                actionTaken = "🛡️ All Roles Stripped (Staff Accountability)";
            } catch {}

        } else {
            actionTaken = "⚠️ Warning Issued (Unmanageable Member)";
        }

        // 4. Send public alert (auto-deletes in 8s)
        const alertEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`🛡️ AUTOMOD: ${type.toUpperCase()} BLOCKED`)
            .setDescription(
                `> **User:** ${author} (\`${author.id}\`)\n` +
                `> **Violation:** ${reason}\n` +
                `> **Strike:** \`${strikes}/${MAX_STRIKES}\`\n` +
                `> **Action:** ${actionTaken}`
            )
            .setFooter({ text: "interX Hyper AutoMod v5.0 • Message deleted" })
            .setTimestamp();

        const alertMsg = await message.channel.send({
            content: `${author}`,
            embeds: [alertEmbed]
        }).catch(() => null);
        if (alertMsg) setTimeout(() => alertMsg.delete().catch(() => {}), 8_000);

        // 5. Log to mod-logs channel
        const logEmbed = new EmbedBuilder()
            .setColor("#FF8C00")
            .setTitle("📋 AUTOMOD LOG ENTRY")
            .addFields(
                { name: "🚨 Violation", value: type, inline: true },
                { name: "⚡ Action", value: actionTaken, inline: true },
                { name: "🎯 Strike", value: `${strikes}/${MAX_STRIKES}`, inline: true },
                { name: "👤 User", value: `${author.tag} (\`${author.id}\`)`, inline: true },
                { name: "💬 Channel", value: `${message.channel}`, inline: true },
                { name: "📋 Reason", value: reason, inline: false }
            )
            .setFooter({ text: "interX AutoMod v5.0" })
            .setTimestamp();

        if (global.logToChannel) {
            await global.logToChannel(guild, "security", logEmbed).catch(() => {});
        } else {
            const logCh = guild.channels.cache.find(c =>
                ["automod-logs","mod-logs","🛡-security-alerts","moderation-logs"].includes(c.name)
            );
            if (logCh) logCh.send({ embeds: [logEmbed] }).catch(() => {});
        }

    } catch (e) {
        console.error("[AutoMod] Punishment error:", e?.message);
    }
}

// ── RAID DETECTION (for external use by guildMemberAdd) ───────────────────
function checkRaid(guildId) {
    const now  = Date.now();
    let d = RAID_MAP.get(guildId) || { joins: [] };
    d.joins = d.joins.filter(t => now - t < RAID_WINDOW);
    d.joins.push(now);
    RAID_MAP.set(guildId, d);
    return d.joins.length >= RAID_LIMIT;
}

// Memory cleanup every minute
setInterval(() => {
    const now = Date.now();
    for (const [k, d] of STRIKE_MAP) {
        if (now - d.lastAt > STRIKE_WINDOW * 5) STRIKE_MAP.delete(k);
    }
    for (const [k, d] of SPAM_MAP) {
        if (now - d.firstAt > SPAM_WINDOW * 10) SPAM_MAP.delete(k);
    }
}, 60_000);

module.exports = { checkAutomod, checkRaid };
