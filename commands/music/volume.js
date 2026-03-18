const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Set music volume")
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("1-200")
                .setRequired(true)
        ),

    name: "volume",
    aliases: ["vol"],
    description: "Set music volume (1-200)",

    // PREFIX COMMAND
    async execute(message, args) {
        const queue = message.client.distube.getQueue(message);
        if (!queue) return message.reply("❌ Nothing playing.");
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 200) return message.reply("❌ Enter a volume between 1 and 200.");
        queue.setVolume(amount);
        message.reply(`🔊 Volume set to **${amount}%**`);
    },

    // SLASH COMMAND
    async slashExecute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction);
        if (!queue) return interaction.reply("❌ Nothing playing.");
        const amount = interaction.options.getInteger("amount");
        queue.setVolume(amount);
        interaction.reply(`🔊 Volume set to **${amount}%**`);
    }
};
