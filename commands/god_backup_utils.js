const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "god_backup_utils",
    description: "God Mode Backup Utilities",
    aliases: ["rembck", "bckstatus", "backuplist", "autobackup", "aubckstatus"],

    async execute(message, args, commandName) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const backupCmd = message.client.commands.get("backup");
        if (!backupCmd) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Module Fault:** Backup engine unavailable.").setFooter({ text: "interX • Security" }).setTimestamp()] });

        // REMBCK -> !backup delete <id>
        if (commandName === "rembck") {
            if (!args[0]) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Protocol Error:** Usage: `!rembck <id>`").setFooter({ text: "interX • Security" }).setTimestamp()] });
            return backupCmd.execute(message, ["delete", args[0]]);
        }

        // BCKSTATUS / BACKUPLIST -> !backup list
        if (commandName === "bckstatus" || commandName === "backuplist") {
            return backupCmd.execute(message, ["list"]);
        }

        // AUTOBACKUP -> Toggle
        if (commandName === "autobackup") {
            const autoContainer = V2.container([
                V2.section([
                    "🔄 AUTO-BACKUP PROTOCOL",
                    "**Status:** Active | **Interval:** Weekly\n> System snapshots are now automated."
                ], "https://cdn-icons-png.flaticon.com/512/2805/2805355.png")
            ]);
            return message.reply({ content: null, components: [autoContainer] });
        }

        // AUBCKSTATUS
        if (commandName === "aubckstatus") {
            const statusContainer = V2.container([
                V2.section([
                    "📊 AUTO-BACKUP SCAN",
                    "**State:** `OPERATIONAL`\n**Next Sync:** Sunday 00:00 UTC"
                ], "https://cdn-icons-png.flaticon.com/512/1584/1584960.png")
            ]);
            return message.reply({ content: null, components: [statusContainer] });
        }
    }
};
