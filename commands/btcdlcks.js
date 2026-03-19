const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const LOCK_DB = path.join(__dirname, "../data/cmd_lock.json");

module.exports = {
    name: "btcdlcks",
    description: "Lock or unlock all bot commands (Owner only)",
    aliases: ["lockcmds", "cmdlock"],
    
    async execute(message, args) {
        const { isBypass } = require("../utils/bypass_system.js");
        if (!isBypass(message.author.id)) {
            const deniedEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("🔒 [ SECURITY_CLEARANCE_FAILURE ]")
                .setDescription("### **AUTHORITY REQUIRED**\n> This command is restricted to the **Bot Owner** only.\n\n> *\"You lack the necessary credentials to modify system-wide command access.\"*")
                .setFooter({ text: "interX • System Authority" })
                .setTimestamp();
            return message.reply({ embeds: [deniedEmbed] });
        }

        let lockData = { locked: false };
        if (fs.existsSync(LOCK_DB)) {
            try {
                lockData = JSON.parse(fs.readFileSync(LOCK_DB, "utf8"));
            } catch (e) {
                lockData = { locked: false };
            }
        }

        lockData.locked = !lockData.locked;
        fs.writeFileSync(LOCK_DB, JSON.stringify(lockData, null, 2));

        const embed = new EmbedBuilder()
            .setColor(lockData.locked ? "#FF0000" : "#00FF00")
            .setTitle(lockData.locked ? "🔒 COMMANDS SECURED" : "🔓 COMMANDS RELEASED")
            .setAuthor({ name: "interX • System Authority", iconURL: message.client.user.displayAvatarURL() })
            .setDescription(
                lockData.locked 
                ? "### **[ SYSTEM_LOCKDOWN ]**\n> All bot commands have been globally restricted.\n> Only **Authorized Architects** (Owners) can currently interact with the system."
                : "### **[ SYSTEM_ONLINE ]**\n> Bot command restrictions have been lifted.\n> All users may now interact with the system normally."
            )
            .setThumbnail(lockData.locked ? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" : "https://cdn-icons-png.flaticon.com/512/481/481195.png")
            .setFooter({ text: `interX • ${lockData.locked ? "Lockdown" : "Active"} Mode` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
