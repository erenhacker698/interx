const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "elock",
    description: "God Mode Lock Commands (Owner Only)",
    aliases: ["el"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        if (!args[0]) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Usage:** `!elock <type> [args]`\nTypes: `role`, `media`, `threads`, `embeds`, `links`, `botcmds`").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const type = args[0].toLowerCase();
        const channel = message.channel;
        const guild = message.guild;

        try {
            // 1. ROLE LOCK
            if (type === "role") {
                const role = message.mentions.roles.first() || guild.roles.cache.get(args[1]);
                if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Error:** Target role not found.").setFooter({ text: "interX • Security" }).setTimestamp()] });

                await channel.permissionOverwrites.edit(role, { SendMessages: false }, { reason: "God Lock: Role Muted" });
                const roleLock = V2.container([
                    V2.section([
                        "🔒 CHANNEL SECURED",
                        `**Protocol:** Role Lockdown\n**Target:** ${role}\n**Status:** \`MUTED\``
                    ], "https://cdn-icons-png.flaticon.com/512/3064/3064155.png")
                ]);
                return message.channel.send({ content: null, components: [roleLock] });
            }

            // 2. MEDIA LOCK
            if (type === "media") {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    AttachFiles: false,
                    EmbedLinks: false
                }, { reason: "God Lock: Media Restricted" });
                const mediaLock = V2.container([
                    V2.section([
                        "🔒 MEDIA PROTOCOL",
                        `**Filter:** Content Suppression\n**Scope:** @everyone\n**Status:** \`DISABLED\``
                    ], "https://cdn-icons-png.flaticon.com/512/3342/3342137.png")
                ]);
                return message.channel.send({ content: null, components: [mediaLock] });
            }

            // 3. THREADS LOCK
            if (type === "threads") {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                    SendMessagesInThreads: false
                }, { reason: "God Lock: Threads Restricted" });
                const threadLock = V2.container([
                    V2.section([
                        "🔒 THREAD PROTOCOL",
                        `**System:** Thread Management\n**Scope:** @everyone\n**Status:** \`DISABLED\``
                    ], "https://cdn-icons-png.flaticon.com/512/5968/5968853.png")
                ]);
                return message.channel.send({ content: null, components: [threadLock] });
            }

            // 4. EMBEDS LOCK
            if (type === "embeds") {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    EmbedLinks: false
                }, { reason: "God Lock: Embeds Restricted" });
                const embedLock = V2.container([
                    V2.section([
                        "🔒 EMBED PROTOCOL",
                        `**Visuals:** Rich Link Filter\n**Scope:** @everyone\n**Status:** \`DISABLED\``
                    ], "https://cdn-icons-png.flaticon.com/512/2164/2164327.png")
                ]);
                return message.channel.send({ content: null, components: [embedLock] });
            }

            // 5. LINKS LOCK
            if (type === "links") {
                updateRestricted(guild.id, channel.id, "links", true);
                const linkLock = V2.container([
                    V2.section([
                        "🔒 LINK PROTOCOL",
                        `**Defense:** Anti-Link Pulse\n**Zone:** ${channel}\n**Status:** \`ACTIVE_VAPORIZE\``
                    ], "https://cdn-icons-png.flaticon.com/512/2088/2088617.png")
                ]);
                return message.channel.send({ content: null, components: [linkLock] });
            }

            // 6. BOT CMDS LOCK
            if (type === "botcmds") {
                const targetRole = message.mentions.roles.first() || (args[1] ? guild.roles.cache.get(args[1]) : null);

                if (targetRole) {
                    updateRestricted(guild.id, targetRole.id, "botcmds_role", true);
                    const botRoleLock = V2.container([
                        V2.section([
                            "🔒 BOT PROTOCOL",
                            `**Clearance:** Command Override\n**Target:** ${targetRole}\n**Status:** \`RESTRICTED\``
                        ], "https://cdn-icons-png.flaticon.com/512/2593/2593627.png")
                    ]);
                    return message.channel.send({ content: null, components: [botRoleLock] });
                } else {
                    updateRestricted(guild.id, channel.id, "botcmds_channel", true);
                    const botChanLock = V2.container([
                        V2.section([
                            "🔒 BOT PROTOCOL",
                            `**Zone Lock:** Command Vacuum\n**Channel:** ${channel}\n**Status:** \`LOCKED\``
                        ], "https://cdn-icons-png.flaticon.com/512/2593/2593627.png")
                    ]);
                    return message.channel.send({ content: null, components: [botChanLock] });
                }
            }
        } catch (e) {
            console.error(e);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("See details below.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};

function updateRestricted(guildId, targetId, type, add) {
    const DB_PATH = path.join(__dirname, "../data/restricted.json");
    let data = {};
    if (fs.existsSync(DB_PATH)) {
        try { data = JSON.parse(fs.readFileSync(DB_PATH)); } catch (e) { }
    }

    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][type]) data[guildId][type] = [];

    if (add) {
        if (!data[guildId][type].includes(targetId)) data[guildId][type].push(targetId);
    } else {
        data[guildId][type] = data[guildId][type].filter(id => id !== targetId);
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
