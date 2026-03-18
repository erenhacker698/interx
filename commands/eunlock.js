const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "eunlock",
    description: "God Mode Unlock Commands (Owner Only)",
    aliases: ["eunl"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        if (!args[0]) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Usage:** `!eunlock <type> [args]`\nTypes: `role`, `media`, `threads`, `embeds`, `links`, `botcmds`").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const type = args[0].toLowerCase();
        const channel = message.channel;
        const guild = message.guild;

        try {
            // 1. ROLE UNLOCK
            if (type === "role") {
                const role = message.mentions.roles.first() || guild.roles.cache.get(args[1]);
                if (!role) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Error:** Target role not found.").setFooter({ text: "interX • Security" }).setTimestamp()] });

                await channel.permissionOverwrites.delete(role, "God Unlock: Role Unmuted");
                const roleUnlock = V2.container([
                    V2.section([
                        "🔓 CHANNEL UNLOCKED",
                        `**Protocol:** Role Restored\n**Target:** ${role}\n**Status:** \`CLEAR\``
                    ], "https://cdn-icons-png.flaticon.com/512/3064/3064197.png")
                ]);
                return message.channel.send({ content: null, components: [roleUnlock] });
            }

            // 2. MEDIA UNLOCK
            if (type === "media") {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    AttachFiles: null,
                    EmbedLinks: null
                }, { reason: "God Unlock: Media Restored" });
                const mediaUnlock = V2.container([
                    V2.section([
                        "🔓 MEDIA PROTOCOL",
                        `**System:** Content Restoration\n**Scope:** @everyone\n**Status:** \`ALLOW\``
                    ], "https://cdn-icons-png.flaticon.com/512/3342/3342137.png")
                ]);
                return message.channel.send({ content: null, components: [mediaUnlock] });
            }

            // 3. THREADS UNLOCK
            if (type === "threads") {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    CreatePublicThreads: null,
                    CreatePrivateThreads: null,
                    SendMessagesInThreads: null
                }, { reason: "God Unlock: Threads Restored" });
                const threadUnlock = V2.container([
                    V2.section([
                        "🔓 THREAD PROTOCOL",
                        `**System:** Thread Restoration\n**Scope:** @everyone\n**Status:** \`ALLOW\``
                    ], "https://cdn-icons-png.flaticon.com/512/5968/5968853.png")
                ]);
                return message.channel.send({ content: null, components: [threadUnlock] });
            }

            // 4. EMBEDS UNLOCK
            if (type === "embeds") {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    EmbedLinks: null
                }, { reason: "God Unlock: Embeds Restored" });
                const embedUnlock = V2.container([
                    V2.section([
                        "🔓 EMBED PROTOCOL",
                        `**System:** Visual Restoration\n**Scope:** @everyone\n**Status:** \`ALLOW\``
                    ], "https://cdn-icons-png.flaticon.com/512/2164/2164327.png")
                ]);
                return message.channel.send({ content: null, components: [embedUnlock] });
            }

            // 5. LINKS UNLOCK
            if (type === "links") {
                updateRestricted(guild.id, channel.id, "links", false);
                const linkUnlock = V2.container([
                    V2.section([
                        "🔓 LINK PROTOCOL",
                        `**Defense:** Anti-Link Pulse Disengaged\n**Zone:** ${channel}\n**Status:** \`CLEAR\``
                    ], "https://cdn-icons-png.flaticon.com/512/2088/2088617.png")
                ]);
                return message.channel.send({ content: null, components: [linkUnlock] });
            }

            // 6. BOT CMDS UNLOCK
            if (type === "botcmds") {
                const targetRole = message.mentions.roles.first() || (args[1] ? guild.roles.cache.get(args[1]) : null);

                if (targetRole) {
                    updateRestricted(guild.id, targetRole.id, "botcmds_role", false);
                    const botRoleUnlock = V2.container([
                        V2.section([
                            "🔓 BOT PROTOCOL",
                            `**Clearance:** Command Restoration\n**Target:** ${targetRole}\n**Status:** \`AUTHORIZED\``
                        ], "https://cdn-icons-png.flaticon.com/512/2593/2593627.png")
                    ]);
                    return message.channel.send({ content: null, components: [botRoleUnlock] });
                } else {
                    updateRestricted(guild.id, channel.id, "botcmds_channel", false);
                    const botChanUnlock = V2.container([
                        V2.section([
                            "🔓 BOT PROTOCOL",
                            `**Zone Clear:** Command Vacuum Repaired\n**Channel:** ${channel}\n**Status:** \`AUTHORIZED\``
                        ], "https://cdn-icons-png.flaticon.com/512/2593/2593627.png")
                    ]);
                    return message.channel.send({ content: null, components: [botChanUnlock] });
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
