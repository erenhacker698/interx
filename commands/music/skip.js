const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song"),

    name: "skip",
    aliases: ["s"],
    description: "Skip the current song",

    // PREFIX COMMAND
    async execute(message, args) {
        const queue = message.client.distube.getQueue(message);
        if (!queue) return message.reply("❌ No music playing.");
        queue.skip();
        message.reply("⏭️ Song skipped.");
    },

    // SLASH COMMAND
    async slashExecute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);
        if (!queue) return interaction.reply("❌ No music playing.");
        queue.skip();
        interaction.reply("⏭️ Song skipped.");
    }
};
