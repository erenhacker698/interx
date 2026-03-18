const { EmbedBuilder } = require("discord.js");

const OWNER_ID = "1250850375284818104"; // put your discord id here

module.exports = (client) => {

    client.on("messageCreate", async (message) => {

        if (message.author.bot) return;
        if (!message.guild) return;

        if (message.mentions.users.has(OWNER_ID)) {

            const embed = new EmbedBuilder()
                .setColor("#ff0000")
                .setTitle("⚠ Owner Mentioned")
                .setDescription("**You tagged my Gurunadhar!**")
                .setFooter({ text: "Respect the owner" })
                .setTimestamp();

            message.reply({ embeds: [embed] });

        }

    });

};