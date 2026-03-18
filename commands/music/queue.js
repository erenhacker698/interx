const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
data: new SlashCommandBuilder()
.setName("queue")
.setDescription("Show music queue"),

async slashExecute(interaction) {

const queue = interaction.client.distube.getQueue(interaction);

if (!queue) return interaction.reply("❌ No songs.");

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("🎶 Music Queue")
.setDescription(
queue.songs.map((song, i) => `${i + 1}. ${song.name}`).join("\n")
);

interaction.reply({ embeds: [embed] });

}
};
