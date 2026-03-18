const { getVoiceConnection } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "stopr",
    description: "Stop recording",

    async execute(message) {
        const connection = getVoiceConnection(message.guild.id);

        if (!connection) {
            return message.reply("❌ No active recording.");
        }

        connection.destroy();

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("⛔ Recording Stopped")
            .setDescription("Voice recording has been stopped.")
            .setFooter({ text: "AntiNuke Recorder System" });

        message.reply({ embeds: [embed] });
    }
};