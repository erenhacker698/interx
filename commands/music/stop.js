const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stop music"),

    async slashExecute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);

        if (!queue) return interaction.reply("❌ Nothing playing.");

        queue.stop();

        interaction.reply("🛑 Music stopped.");
    }
};
