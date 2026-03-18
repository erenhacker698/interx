const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "god_security",
    description: "God Mode Security Commands",
    aliases: ["scanserver", "purgebots", "recovery", "flagged"],

    async execute(message, args, commandName) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        // SCANSERVER: Audit Wrapper
        if (commandName === "scanserver") {
            const auditCmd = message.client.commands.get("audit");
            if (auditCmd) return auditCmd.execute(message, args);
            else return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Module Fault:** Audit scanner module not found.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        // PURGEBOTS: Kick all bots except me
        if (commandName === "purgebots") {
            const bots = message.guild.members.cache.filter(m => m.user.bot && m.id !== message.client.user.id);
            if (bots.size === 0) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("ℹ️ **Network Scan:** No unauthorized bot entities detected.").setFooter({ text: "interX • Security" }).setTimestamp()] });

            const initContainer = V2.container([
                V2.section([
                    "🚨 INITIATING BOT PURGE",
                    `Targeting **${bots.size}** detected bot entities for immediate termination.`
                ], "https://cdn-icons-png.flaticon.com/512/3662/3662817.png")
            ]);

            await message.reply({ content: null, components: [initContainer] });

            let kicked = 0;
            await Promise.all(Array.from(bots.values()).map(async (bot) => {
                if (bot.kickable) {
                    await bot.kick("God Mode: Bot Purge Protocol");
                    kicked++;
                }
            }));

            const completeContainer = V2.container([
                V2.section([
                    "✅ PURGE COMPLETE",
                    `Eliminated **${kicked}** unauthorized bot entities from the server node.`
                ], "https://cdn-icons-png.flaticon.com/512/190/190411.png")
            ]);

            return message.channel.send({ content: null, components: [completeContainer] });
        }

        // FLAGGED: Check for dangerous users
        if (commandName === "flagged") {
            const dangerous = message.guild.members.cache.filter(m =>
                m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot && m.id !== message.guild.ownerId
            );

            const dangerousList = dangerous.size > 0
                ? dangerous.map(m => `> • ${m.user.tag} (\`${m.id}\`) - **ADMIN**`).join("\n")
                : "> *No unauthorized administrators detected.*";

            const flaggedContainer = V2.container([
                V2.section([
                    "🚩 THREAT ANALYSIS REPORT",
                    `### **[ FLAGGED_ENTITIES ]**\n\n${dangerousList}`
                ], "https://cdn-icons-png.flaticon.com/512/179/179386.png"),
                "*interX • Security Risk Assessment*"
            ], dangerous.size > 0 ? V2_RED : V2_BLUE);

            return message.reply({ content: null, components: [flaggedContainer] });
        }

        if (commandName === "recovery") {
            const restoreCmd = message.client.commands.get("restore");
            if (restoreCmd) return restoreCmd.execute(message, args);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Module Fault:** Recovery engine not found.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
