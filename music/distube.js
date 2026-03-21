const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = (client) => {

    // ─── LOAD COOKIES (from file or env) ───
    // Cookies help bypass YouTube's "Sign in to confirm you're not a bot" error.
    // See below for how to get your cookies.
    let ytCookies = undefined;
    const cookieFilePath = path.join(__dirname, "..", "data", "yt_cookies.json");

    if (process.env.YT_COOKIES) {
        // GitHub Actions / environment variable (JSON string)
        try {
            ytCookies = JSON.parse(process.env.YT_COOKIES);
            console.log("🍪 [DisTube] YouTube cookies loaded from environment.");
        } catch (e) {
            console.warn("⚠️ [DisTube] YT_COOKIES env var is set but failed to parse as JSON.");
        }
    } else if (fs.existsSync(cookieFilePath)) {
        // Local file fallback: data/yt_cookies.json
        try {
            ytCookies = JSON.parse(fs.readFileSync(cookieFilePath, "utf8"));
            console.log("🍪 [DisTube] YouTube cookies loaded from yt_cookies.json.");
        } catch (e) {
            console.warn("⚠️ [DisTube] yt_cookies.json exists but failed to parse.");
        }
    } else {
        console.warn("⚠️ [DisTube] No YouTube cookies found. YouTube may block playback. Add data/yt_cookies.json or YT_COOKIES env var.");
    }

    // ─── YOUTUBE PLUGIN CONFIG ───
    const ytPluginOptions = {};
    if (ytCookies) ytPluginOptions.cookies = ytCookies;

    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        emitAddSongWhenCreatingQueue: false,
        emitAddListWhenCreatingQueue: false,
        plugins: [
            new YouTubePlugin(ytPluginOptions),
            new SpotifyPlugin()
        ],
        ffmpeg: {
            path: require("ffmpeg-static")
        }
    });

    // ───────────────── STATUS STRING ─────────────────
    const status = (queue) =>
        `**Volume:** \`${queue.volume}%\` | **Loop:** \`${queue.repeatMode === 0 ? "Off" : queue.repeatMode === 2 ? "All Queue" : "This Song"}\` | **Autoplay:** \`${queue.autoplay ? "On" : "Off"}\``;

    // ───────────────── MUSIC CONTROL BUTTONS ─────────────────
    const createMusicRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pause_resume").setLabel("⏯️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("skip").setLabel("⏭️").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("stop").setLabel("⏹️").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("loop").setLabel("🔁").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("voldown").setLabel("🔉").setStyle(ButtonStyle.Secondary)
    );

    // ───────────────── DISTUBE EVENTS ─────────────────

    client.distube.on("playSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🎵 [ AUDIO_NODE_ACTIVE ]")
            .setAuthor({ name: "interX Music Infrastructure", iconURL: client.user?.displayAvatarURL() ?? undefined })
            .setDescription(
                `### **Now Playing:** [${song.name}](${song.url})\n\n` +
                `> **Duration:** \`${song.formattedDuration}\` | **Requested by:** ${song.user}\n\n` +
                status(queue)
            )
            .setImage(song.thumbnail ?? null)
            .setFooter({ text: "interX • High Fidelity Streaming Core" })
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed], components: [createMusicRow()] }).catch(() => {});
    });

    client.distube.on("addSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("➕ MOUNTING_TO_QUEUE")
            .setDescription(`> **Track:** [${song.name}](${song.url})\n> **Duration:** \`${song.formattedDuration}\` | **Requested by:** ${song.user}`)
            .setFooter({ text: "interX • Buffer Optimized" })
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    });

    client.distube.on("addList", (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("📂 PLAYLIST_ENQUEUED")
            .setDescription(`> **Playlist:** [${playlist.name}](${playlist.url})\n> **Size:** \`${playlist.songs.length} tracks\``)
            .setFooter({ text: "interX • Batch Stream Initialization" })
            .setTimestamp();

        queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
    });

    // ─── DisTube v5 error signature: (error, queue, song?) ───
    client.distube.on("error", (error, queue, song) => {
        console.error(`[DisTube Error] ${error.message}`, error);
        const channel = queue?.textChannel;
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("❌ STREAM_ERROR_TERMINATED")
                .setDescription(`\`\`\`\n${error.toString().slice(0, 500)}\n\`\`\`\n\n> ⚠️ If you see **"Sign in to confirm you're not a bot"**, the bot needs YouTube cookies. Contact the bot owner.`)
                .setFooter({ text: "interX • System Diagnostic Kernel" });
            channel.send({ embeds: [embed] }).catch(() => {});
        }
    });

    // ─── DisTube v5: empty event emits (queue), NOT (channel) ───
    client.distube.on("empty", (queue) => {
        queue.textChannel?.send("⚠️ **[ VOICE_STAGNANT ]** Channel is empty. Entering low-power mode.").catch(() => {});
    });

    client.distube.on("finish", (queue) => {
        queue.textChannel?.send("🏁 **[ QUEUE_DEPLETED ]** All tracks in buffer processed.").catch(() => {});
    });

    client.distube.on("disconnect", (queue) => {
        queue.textChannel?.send("🔌 **[ NODE_DISCONNECTED ]** Audio session closed.").catch(() => {});
    });

    console.log("🎵 [DisTube Core] Stabilized and active for interX.");
};