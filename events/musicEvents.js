const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {
    // Guard: DisTube must be initialized first (called after music/distube.js)
    if (!client.distube) return;

    // ─── playSong: handled in music/distube.js (full embed + buttons) ───
    // This event file handles secondary/supplementary events only.

    // ─── Button interactions for music controls ───
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        const musicButtonIds = ["pause", "skip", "stop", "loop", "pause_resume", "voldown", "volup"];
        if (!musicButtonIds.includes(interaction.customId)) return;

        const queue = client.distube.getQueue(interaction.guildId);

        if (!interaction.member?.voice?.channelId) {
            return interaction.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Join a Voice Channel first.", ephemeral: true }).catch(() => {});
        }

        if (!queue) {
            return interaction.reply({ content: "❌ No active audio stream detected.", ephemeral: true }).catch(() => {});
        }

        try {
            switch (interaction.customId) {
                case "pause":
                case "pause_resume":
                    if (queue.paused) {
                        queue.resume();
                        await interaction.reply({ content: "▶️ **[ STREAM_RESUMED ]**", ephemeral: true });
                    } else {
                        queue.pause();
                        await interaction.reply({ content: "⏸️ **[ STREAM_PAUSED ]**", ephemeral: true });
                    }
                    break;

                case "skip":
                    if (queue.songs.length <= 1) {
                        await interaction.reply({ content: "❌ No pending tracks to skip.", ephemeral: true });
                    } else {
                        await queue.skip();
                        await interaction.reply({ content: "⏭️ **[ TRACK_BYPASSED ]**", ephemeral: true });
                    }
                    break;

                case "stop":
                    await queue.stop();
                    await interaction.reply({ content: "⏹️ **[ SESSION_TERMINATED ]**", ephemeral: true });
                    break;

                case "loop":
                    const mode = queue.repeatMode === 0 ? 1 : 0;
                    queue.setRepeatMode(mode);
                    await interaction.reply({ content: mode === 1 ? "🔁 **Loop enabled** (current song)" : "🔁 **Loop disabled**", ephemeral: true });
                    break;

                case "voldown": {
                    const dVol = Math.max(0, queue.volume - 10);
                    queue.setVolume(dVol);
                    await interaction.reply({ content: `🔉 Volume → \`${dVol}%\``, ephemeral: true });
                    break;
                }

                case "volup": {
                    const uVol = Math.min(200, queue.volume + 10);
                    queue.setVolume(uVol);
                    await interaction.reply({ content: `🔊 Volume → \`${uVol}%\``, ephemeral: true });
                    break;
                }
            }
        } catch (err) {
            console.error("[MusicEvents Button Error]", err);
            if (!interaction.replied && !interaction.deferred) {
                interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true }).catch(() => {});
            }
        }
    });
};