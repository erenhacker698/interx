const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/botlock.json");

function load() {
    return JSON.parse(fs.readFileSync(filePath));
}

function save(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("btcmdlocks")
        .setDescription("Toggle bot command lock"),

    async execute(interaction) {

        // 🔐 only owner
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ Only owner can use this",
                ephemeral: true
            });
        }

        const data = load();

        data.locked = !data.locked;
        save(data);

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🔒 BOT COMMAND LOCK")
            .setDescription(`Bot commands are now **${data.locked ? "LOCKED" : "UNLOCKED"}**`)
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};