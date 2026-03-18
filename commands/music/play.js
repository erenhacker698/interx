const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song")
        .addStringOption(option =>
            option.setName("song")
                .setDescription("Song name or URL")
                .setRequired(true)
        ),

    name: "play",
    aliases: ["p"],
    description: "Play a song",

    // PREFIX COMMAND
    async execute(message, args) {
        if (!message.guild) return;
        const voice = message.member?.voice?.channel;
        if (!voice) return message.reply("❌ Join a voice channel first.");
        const song = args.join(" ");
        if (!song) return message.reply("❌ Provide a song name or URL.");
        message.reply("🔎 Searching...");
        message.client.distube.play(voice, song, {
            member: message.member,
            textChannel: message.channel
        });
    },

    // SLASH COMMAND
    async slashExecute(interaction) {
        const voice = interaction.member.voice.channel;
        if (!voice) return interaction.reply("❌ Join a voice channel first.");
        const song = interaction.options.getString("song");
        await interaction.reply("🔎 Searching...");
        interaction.client.distube.play(voice, song, {
            member: interaction.member,
            textChannel: interaction.channel
        });
    }
};