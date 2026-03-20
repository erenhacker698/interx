const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "botrestart",
    description: "♻️ interX Core Systems: Full Node Reboot",
    aliases: ["reboot", "restart", "rs"],
    usage: "!botrestart",

    async execute(message, args) {
        // 🛡️ SECURITY: ONLY Bot Owners / Developers can trigger a reboot
        const isBypass = require("../utils/bypass_system").isBypass(message.author.id, message.guild.id);
        
        if (!isBypass) {
            return message.reply({
                components: [V2.container([
                    "🚫 ACCESS DENIED",
                    "### **Protocol: PRIVILEGE_INSUFFICIENT**\n> Unauthorized attempt to neutralize core systems detected.\n\n> *\"Access to the core reboot sequence is restricted to the Architect only.\"*"
                ], "#df0000")]
            });
        }

        const rebootEmbed = new EmbedBuilder()
            .setColor("#df0000") // interX Red
            .setTitle("♻️ CORE SYSTEMS REBOOTING")
            .setDescription(`### **Protocol: SYSTEM_RESTART_INITIATED**\n> **Authorized By:** ${message.author}\n> **Action:** Flushing cache & recycling process...\n\n*The bot will be offline for a few moments as it re-initializes the interX Sovereign Network.*`)
            .setFooter({ text: "interX Sovereign • Reboot Protocol" })
            .setTimestamp();

        await message.reply({ content: "**SHUTTING DOWN CORE...**", embeds: [rebootEmbed] });

        console.log(`♻️ [System] Manual Reboot triggered by ${message.author.tag} (${message.author.id})`);

        // Set a global flag for cleanup (optional)
        global.isShuttingDown = true;

        // Graceful Exit after 1.5 seconds to ensure the Discord message was sent
        setTimeout(() => {
            process.exit(0); // Standard Exit Code (Process Managers like PM2/Nodemon/Replit will auto-restart)
        }, 1500);
    }
};
