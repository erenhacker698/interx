const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Toggle loop mode for the current song or the full queue")
        .addIntegerOption(opt =>
            opt.setName("mode")
               .setDescription("0 = Off, 1 = Song, 2 = Queue")
               .setRequired(false)
               .addChoices(
                   { name: "Off", value: 0 },
                   { name: "Song", value: 1 },
                   { name: "Queue", value: 2 }
               )
        ),

    name: "loop",
    aliases: ["repeat"],
    description: "Toggle loop mode",

    // PREFIX COMMAND
    async execute(message, args) {
        const queue = message.client.distube?.getQueue(message.guild.id);
        if (!queue) return message.reply("❌ No music playing.");

        // Cycle: Off → Song → Queue → Off
        const newMode = (queue.repeatMode + 1) % 3;
        queue.setRepeatMode(newMode);
        const modeNames = ["🔁 **Loop OFF**", "🔂 **Looping current song**", "🔁 **Looping entire queue**"];
        return message.reply(modeNames[newMode]);
    },

    // SLASH COMMAND
    async slashExecute(interaction) {
        const queue = interaction.client.distube?.getQueue(interaction.guildId);
        if (!queue) return interaction.reply({ content: "❌ No music playing.", ephemeral: true });

        const mode = interaction.options.getInteger("mode") ?? (queue.repeatMode + 1) % 3;
        queue.setRepeatMode(mode);
        const modeNames = ["🔁 **Loop OFF**", "🔂 **Looping current song**", "🔁 **Looping entire queue**"];
        return interaction.reply(modeNames[mode]);
    }
};