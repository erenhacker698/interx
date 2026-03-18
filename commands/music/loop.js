const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Toggle loop"),

    async execute(interaction) {

        const queue = interaction.client.distube.getQueue(interaction);
        if (!queue) return interaction.reply("Nothing playing.");

        const mode = queue.setRepeatMode(queue.repeatMode ? 0 : 1);

        interaction.reply(mode ? "🔁 Loop enabled" : "Loop disabled");

    }
};