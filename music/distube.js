const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {

    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        plugins: [
            new YouTubePlugin(),
            new SpotifyPlugin()
        ]
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
            .setColor("#FF0000")
            .setTitle("🎵 [ POWERFUL_AUDIO_NODE ]")
            .setAuthor({ name: "interX Music Management", iconURL: client.user.displayAvatarURL() })
            .setDescription(`### **Now Playing:** [${song.name}](${song.url})\n\n> **Duration:** \`${song.formattedDuration}\` | **Requested by:** ${song.user}\n\n${status(queue)}`)
            .setImage(song.thumbnail)
            .setFooter({ text: "interX • High Fidelity Streaming Core" })
            .setTimestamp();

        queue.textChannel.send({ embeds: [embed], components: [createMusicRow()] });
    });

    client.distube.on("addSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("➕ MOUNTING_TO_QUEUE")
            .setDescription(`> **Track:** [${song.name}](${song.url})\n> **Duration:** \`${song.formattedDuration}\` | **Requested by:** ${song.user}`)
            .setFooter({ text: "interX • Buffer Optimized" })
            .setTimestamp();

        queue.textChannel.send({ embeds: [embed] });
    });

    client.distube.on("addList", (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("📂 PLAYLIST_ENQUEUED")
            .setDescription(`> **Playlist:** [${playlist.name}](${playlist.url})\n> **Size:** \`${playlist.songs.length} tracks\``)
            .setFooter({ text: "interX • Batch Stream Initialization" })
            .setTimestamp();

        queue.textChannel.send({ embeds: [embed] });
    });

    client.distube.on("error", (channel, e) => {
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("❌ STREAM_ERROR_TERMINATED")
                .setDescription(`\`\`\`\n${e.toString().slice(0, 500)}\n\`\`\``)
                .setFooter({ text: "interX • System Diagnostic Kernel" });
            channel.send({ embeds: [embed] });
        }
        console.error(e);
    });

    // ───────────────── BUTTON INTERACTIONS ─────────────────
    client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;
        const queue = client.distube.getQueue(interaction.guildId);
        if (!queue) return;

        // Check if user is in voice channel
        const memberChannel = interaction.member.voice.channelId;
        const botChannel = interaction.guild.members.me.voice.channelId;
        if (!memberChannel) {
             return interaction.reply({ content: "⚠️ You must be in a Voice Channel.", ephemeral: true });
        }
        if (botChannel && memberChannel !== botChannel) {
            return interaction.reply({ content: "⚠️ You must be in the same Voice Channel as the bot.", ephemeral: true });
        }

        try {
            switch (interaction.customId) {
                case "pause_resume":
                    if (queue.paused) {
                        queue.resume();
                        await interaction.reply({ content: "▶️ Resumed tracking.", ephemeral: true });
                    } else {
                        queue.pause();
                        await interaction.reply({ content: "⏸️ Stream restricted (Paused).", ephemeral: true });
                    }
                    break;
                case "skip":
                    if (queue.songs.length <= 1) {
                         await interaction.reply({ content: "❌ No more tracks to skip.", ephemeral: true });
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

    console.log("🎵 [DisTube] Advanced Music Core active with Premium Red UI.");
};