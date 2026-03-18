const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "massban",
    description: "Mass Ban multiple users by ID (Admin Only)",
    usage: "!massban <id1> <id2> <id3> ... [reason]",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **ACCESS DENIED** | Protocol Omega Restricted to Bot Owner.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (args.length === 0) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Invalid Syntax**\nUsage: `!massban <id1> <id2> ... [reason]`").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const ids = [];
        const reasonParts = [];

        for (const arg of args) {
            if (/^\d{17,19}$/.test(arg)) {
                ids.push(arg);
            } else {
                reasonParts.push(arg);
            }
        }

        const reason = reasonParts.join(" ") || "Mass Ban Operation - Security Protocol";

        if (ids.length === 0) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **No valid user IDs found.**").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const initContainer = V2.container([
            V2.section([
                "⚠️ MASS BAN INITIATED",
                `Preparing to ban **${ids.length}** targets.\n**Reason:** ${reason}`
            ], "https://cdn-icons-png.flaticon.com/512/564/564619.png")
        ], "#FFFF00");

        const confirmMsg = await message.reply({ content: null, components: [initContainer] });

        let successCount = 0;
        let failCount = 0;

        await Promise.all(ids.map(async (id) => {
            if ((id === BOT_OWNER_ID || id === BOT_DEV_ID)) {
                failCount++;
                return;
            }
            try {
                await message.guild.members.ban(id, { reason: reason });
                successCount++;
            } catch (err) {
                failCount++;
            }
        }));

        const finalContainer = V2.container([
            V2.section([
                "🚫 MASS BAN COMPLETE",
                V2.text(
                    `### **[ OPERATION_OMEGA_SUCCESS ]**\n\n` +
                    `> **Banned Entites:** \`${successCount}\`\n` +
                    `> **Failed Linked:** \`${failCount}\`\n` +
                    `> **Stored Reason:** ${reason}`
                )
            ], "https://cdn-icons-png.flaticon.com/512/190/190411.png"),
            "*interX • Global Blacklist Sync*"
        ]);

        return confirmMsg.edit({ content: null, components: [finalContainer] });
    }
};
