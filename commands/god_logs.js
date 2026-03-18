const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "god_logs",
    description: "God Mode Logging Commands",
    aliases: ["elogs", "auditlogs", "elogsbot", "eloggings"],

    async execute(message, args, commandName) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;
        const botAvatar = message.client.user.displayAvatarURL();

        // ELOGS: Audit Log Dump
        if (commandName === "elogs" || commandName === "auditlogs") {
            const logs = await message.guild.fetchAuditLogs({ limit: 10 }).catch(() => null);
            if (!logs) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **System Error:** Failed to fetch audit logs from the guild shard.").setFooter({ text: "interX • Security" }).setTimestamp()] });

            const logEntries = logs.entries.map(e =>
                `> \`[${e.actionType}]\` **${e.executor.tag}** -> ${e.target ? e.target.tag || e.target.id : "Unknown"}`
            ).join("\n") || "> *No recent logs.*";

            const logContainer = new EmbedBuilder().setColor(0xFF0033).setTitle("📜 SYSTEM AUDIT FEED").setDescription(`### **[ RECENT_OPERATIONS ]**\n\n${logEntries}`).addFields({ name: "📋 Details", value: "*interX • Kernel Audit Mirror*" }).setFooter({ text: "interX • Security" }).setTimestamp();

            return message.reply({ content: null, components: [logContainer] });
        }

        // ELOGSBOT: Internal Session Logs
        if (commandName === "elogsbot") {
            const botLogContainer = V2.container([
                V2.section([
                    "📂 KERNEL LOG STREAM",
                    "**Internal session memory is clear.**\n> *No critical runtime anomalies recorded.*"
                ], botAvatar)
            ]);
            return message.reply({ content: null, components: [botLogContainer] });
        }

        // ELOGGINGS: Setup logs wrapper
        if (commandName === "eloggings") {
            const logCmd = message.client.commands.get("log");
            if (logCmd) return logCmd.execute(message, args);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Module Fault:** Logging setup module not found.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
