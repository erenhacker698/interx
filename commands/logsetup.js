const { EmbedBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const fastCache = require("../utils/fastCache");

module.exports = {
    name: "logsetup",
    description: "Generate the interX log kernel infrastructure",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const guild = message.guild;
        const msg = await message.reply("⚙️ **[ INITIALIZING_LOG_KERNEL ]** ... Establishing secure database path.");

        // Ensure category exists
        let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "interx log kernel");
        if (!category) {
            category = await guild.channels.create({
                name: "interX LOG KERNEL",
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }
                ]
            }).catch(() => null);
        }

        if (!category) return msg.edit("❌ **ERROR:** Failed to create or find log category. Check my permissions.");

        const logChannelsMap = {
            message: "message logs",
            joins: "joins logs",
            leaves: "leaves logs",
            mod: "moderation logs",
            security: "security logs",
            server: "server logs",
            role: "role logs",
            voice: "voice logs",
            member: "member logs",
            channel: "channel logs",
            invite: "invite logs",
            antinuke: "antinuke logs",
            ban: "ban logs",
            action: "action logs",
            admin: "admin logs",
            webhook: "webhook logs",
            emoji: "emoji logs",
            sticker: "sticker logs",
            boost: "boost logs",
            automod: "automod logs",
            thread: "thread logs",
            audit: "audit logs",
            verification: "verification logs",
            backup: "backup logs",
            incident: "incident logs"
        };

        const LOGS_DB = path.join(__dirname, "../data/logs.json");
        const allLogs = fastCache.get(LOGS_DB) || {};
        if (!allLogs[guild.id]) allLogs[guild.id] = {};

        const results = [];
        // Ensure we have current channels in cache
        await guild.channels.fetch().catch(() => { });

        for (const [key, name] of Object.entries(logChannelsMap)) {
            let ch = guild.channels.cache.find(c => c.name === name && c.parentId === category.id);
            if (!ch) {
                ch = await guild.channels.create({
                    name: name,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    topic: `interX ${name.toUpperCase()} channel. Powered by Red-Label Engine.`
                }).catch(() => null);
            }
            if (ch) {
                allLogs[guild.id][key] = ch.id;
                results.push(`✅ \`${name}\``);
            }
        }

        // ⚡ CRITICAL FIX: Use fastCache.set to ensure memory bridge sync
        fastCache.set(LOGS_DB, allLogs);

        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("📁 LOG KERNEL OPERATIONAL")
            .setAuthor({ name: "interX • System Architecture", iconURL: message.client.user.displayAvatarURL() })
            .setDescription(
                "### **[ KERNEL_ESTABLISHED ]**\n> All secure logging sectors have been constructed and calibrated with the #FF0000 red theme.\n\n" +
                results.slice(0, 15).join("\n") + (results.length > 15 ? `\n> *... and ${results.length - 15} more channels.*` : "")
            )
            .setFooter({ text: "interX • Logging Protocol ACTIVE" })
            .setTimestamp();

        return msg.edit({ content: null, embeds: [embed] });
    }
};

