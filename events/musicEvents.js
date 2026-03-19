const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {
    if (!client.distube) return;

    client.distube.on("playSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("🎵 Now Playing")
            .setDescription(`[${song.name}](${song.url})`)
            .setThumbnail(song.thumbnail)
            .addFields(
                { name: "Duration", value: song.formattedDuration, inline: true },
                { name: "Requested by", value: song.user.tag, inline: true }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("pause").setLabel("⏯").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("skip").setLabel("⏭").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("stop").setLabel("⏹").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("loop").setLabel("🔁").setStyle(ButtonStyle.Success)
        );

        queue.textChannel.send({ embeds: [embed], components: [row] });
    });
};