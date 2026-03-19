const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {

    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        plugins: [
            new YouTubePlugin(),
            new SpotifyPlugin()
        ],
        ffmpeg: {
            path: require("ffmpeg-static")
        }
    });

    // ───────────────── DISCORD UI COMPONENTS ─────────────────
    const status = (queue) =>
        `**Volume:** \`${queue.volume}%\` | **Loop:** \`${queue.repeatMode ? (queue.repeatMode === 2 ? "All Queue" : "This Song") : "Off"}\` | **Autoplay:** \`${queue.autoplay ? "On" : "Off"}\``;

    const createMusicRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pause_resume").setLabel("⏯️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("skip").setLabel("⏭️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("stop").setLabel("⏹️").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("voldown").setLabel("🔉").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("volup").setLabel("🔊").setStyle(ButtonStyle.Secondary)
    );

    // ───────────────── DISTUBE EVENTS ─────────────────
    client.distube.on("playSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000") // interX Red from config
            .setTitle("🎵 [ AUDIO_NODE_ACTIVE ]")
            .setAuthor({ name: "interX Music Infrastructure", iconURL: client.user.displayAvatarURL() })
            .setDescription(`### **Now Playing:** [${song.name}](${song.url})\n\n> **Duration:** \`${song.formattedDuration}\` | **Requested by:** ${song.user}\n\n${status(queue)}`)
            .setImage(song.thumbnail)
            .setFooter({ text: "interX • High Fidelity Streaming Core" })
            .setTimestamp();

        queue.textChannel.send({ embeds: [embed], components: [createMusicRow()] });
    });

    client.distube.on("addSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("➕ MOUNTING_TO_QUEUE")
            .setDescription(`> **Track:** [${song.name}](${song.url})\n> **Duration:** \`${song.formattedDuration}\` | **Requested by:** ${song.user}`)
            .setFooter({ text: "interX • Buffer Optimized" })
            .setTimestamp();

        queue.textChannel.send({ embeds: [embed] });
    });

    client.distube.on("addList", (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("📂 PLAYLIST_ENQUEUED")
            .setDescription(`> **Playlist:** [${playlist.name}](${playlist.url})\n> **Size:** \`${playlist.songs.length} tracks\``)
            .setFooter({ text: "interX • Batch Stream Initialization" })
            .setTimestamp();

        queue.textChannel.send({ embeds: [embed] });
    });

    client.distube.on("error", (channel, e) => {
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("❌ STREAM_ERROR_TERMINATED")
                .setDescription(`\`\`\`\n${e.toString().slice(0, 500)}\n\`\`\``)
                .setFooter({ text: "interX • System Diagnostic Kernel" });
            channel.send({ embeds: [embed] });
        }
        console.error(e);
    });

    client.distube.on("empty", channel => {
        channel.send("⚠️ **[ VOICE_STAGNANT ]** Channel is empty. Entering low-power mode.");
    });

    client.distube.on("finish", queue => {
        queue.textChannel.send("🏁 **[ QUEUE_DEPLETED ]** All tracks in buffer processed.");
    });

    // ───────────────── BUTTON INTERACTIONS ─────────────────
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        const queue = client.distube.getQueue(interaction.guildId);
        if (!queue) return;

        // Check user voice state
        if (!interaction.member.voice.channelId) {
             return interaction.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Join a Voice Channel to regulate audio nodes.", ephemeral: true });
        }

        try {
            switch (interaction.customId) {
                case "pause_resume":
                    if (queue.paused) {
                        queue.resume();
                        await interaction.reply({ content: "▶️ Resumed transmission.", ephemeral: true });
                    } else {
                        queue.pause();
                        await interaction.reply({ content: "⏸️ Transmission restricted (Paused).", ephemeral: true });
                    }
                    break;
                case "skip":
                    if (queue.songs.length <= 1) {
                         await interaction.reply({ content: "❌ No pending tracks in buffer.", ephemeral: true });
                    } else {
                        await queue.skip();
                        await interaction.reply({ content: "⏭️ Forced skip (Next Track).", ephemeral: true });
                    }
                    break;
                case "stop":
                    queue.stop();
                    await interaction.reply({ content: "⏹️ Stream terminated (Session Closed).", ephemeral: true });
                    break;
                case "voldown":
                    let dVol = Math.max(0, queue.volume - 10);
                    queue.setVolume(dVol);
                    await interaction.reply({ content: `🔉 Amplitude decreased to \`${dVol}%\``, ephemeral: true });
                    break;
                case "volup":
                    let uVol = Math.min(100, queue.volume + 10);
                    queue.setVolume(uVol);
                    await interaction.reply({ content: `🔊 Amplitude increased to \`${uVol}%\``, ephemeral: true });
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

    console.log("🎵 [DisTube Core] Stabilized and active for interX.");
};