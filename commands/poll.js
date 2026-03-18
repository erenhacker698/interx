const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "poll",
    description: "Create a simple poll using the premium V2 interface",
    usage: "!poll <Question> | <Option1> | <Option2> ...",
    aliases: ["createpoll"],
    permissions: [PermissionsBitField.Flags.ManageMessages],

    async execute(message, args) {
        // 1. Parse Args
        const raw = args.join(" ");
        const parts = raw.split("|").map(p => p.trim()).filter(p => p.length > 0);

        if (parts.length < 2) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ POLL USAGE").setDescription(`!poll Question | Option 1 | Option 2 ...`).setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const question = parts[0];
        const options = parts.slice(1);

        if (options.length > 10) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("❌ LIMIT EXCEEDED").setDescription("Maximum 10 options allowed.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        // 2. Build V2 Container
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        let description = "";
        for (let i = 0; i < options.length; i++) {
            description += `${emojis[i]} **${options[i]}**\n\n`;
        }

        const pollContainer = V2.container([
            V2.section(
                [
                    V2.heading(question, 2),
                    V2.text(description)
                ],
                "https://cdn-icons-png.flaticon.com/512/2620/2620436.png" // Poll/Chart icon
            ),
            `**Poll Started by:** ${message.author.tag}`
        ], "#0099ff"); // Blue

        // 3. Send & React
        const pollMsg = await message.channel.send({
            content: null,
            components: [pollContainer]
        });

        for (let i = 0; i < options.length; i++) {
            await pollMsg.react(emojis[i]);
        }

        // Delete command message to keep it clean
        message.delete().catch(() => { });
    }
};
