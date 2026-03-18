const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "testroles",
    description: "Initialize 5 temporary test roles",
    aliases: ["tr"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const roleNames = [
            "Cyber Sentry",
            "Neural Link",
            "Data Ghost",
            "Void Runner",
            "Core Shadow"
        ];

        try {
            const logs = [];
            for (const name of roleNames) {
                await message.guild.roles.create({
                    name: name,
                    reason: "Test role initialization"
                });
                logs.push(`✅ Created role: **${name}**`);
            }

            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🎭 TEST ROLES INITIALIZED").setDescription("See details below.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        } catch (err) {
            console.error(err);
            return message.reply("❌ **ERROR:** Failed to create roles.");
        }
    }
};
