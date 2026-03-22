const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = (client) => {

    // ─── LOAD COOKIES ───
    let ytCookies = undefined;
    const cookieFilePath = path.join(__dirname, "..", "data", "yt_cookies.json");

    if (process.env.YT_COOKIES) {
        try { ytCookies = JSON.parse(process.env.YT_COOKIES); } catch (e) { }
    } else if (fs.existsSync(cookieFilePath)) {
        try { ytCookies = JSON.parse(fs.readFileSync(cookieFilePath, "utf8")); } catch (e) { }
    }

    const ytPluginOptions = {};
    if (ytCookies) ytPluginOptions.cookies = ytCookies;

    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        plugins: [
            new YouTubePlugin(ytPluginOptions),
            new SpotifyPlugin({ emitEventsAfterFetching: true })
        ],
        ffmpeg: {
            path: require("ffmpeg-static")
        }
    });

    // ───────────────── MUSIC CONTROL BUTTONS ─────────────────
    const createMusicRow = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pause_resume").setEmoji("⏯️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("voldown").setEmoji("🔉").setStyle(ButtonStyle.Secondary)
    );

    // ───────────────── DISTUBE EVENTS ─────────────────

    client.distube.on("playSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000") // Red theme
            .setAuthor({ name: "Now Playing", iconURL: "https://cdn-icons-png.flaticon.com/512/3060/3060411.png" })
            .setTitle(song.name)
            .setURL(song.url)
            .setDescription(
                `**Duration:** \`${song.formattedDuration}\`\n` +
                `**Requested by:** ${song.user}\n` +
                `**Volume:** \`${queue.volume}%\``
            )
            .setImage(song.thumbnail)
            .setFooter({ text: "interX Premium Music Player" });

        queue.textChannel?.send({ embeds: [embed], components: [createMusicRow()] }).catch(() => { });
    });

    client.distube.on("addSong", (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setAuthor({ name: "Added to Queue", iconURL: "https://scalebranding.com/wp-content/uploads/2021/08/Music-Play-Logo-Design-4.jpg" })
            .setDescription(`**[${song.name}](${song.url})**\nDuration: \`${song.formattedDuration}\` | Added by: ${song.user}`)
            .setThumbnail(song.thumbnail);

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    client.distube.on("addList", (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setAuthor({ name: "Playlist Added to Queue", iconURL: "https://scalebranding.com/wp-content/uploads/2021/08/Music-Play-Logo-Design-4.jpg" })
            .setDescription(`**[${playlist.name}](${playlist.url})**\nTracks: \`${playlist.songs.length}\``)
            .setThumbnail(playlist.thumbnail);

        queue.textChannel?.send({ embeds: [embed] }).catch(() => { });
    });

    client.distube.on("error", (error, queue, song) => {
        const channel = queue?.textChannel;
        if (!channel) return;

        const errStr = String(error);

        // Friendly error for the YouTube bot restriction
        if (errStr.includes("Sign in to confirm you're not a bot")) {
            const embed = new EmbedBuilder()
                .setColor("#ff3333")
                .setAuthor({ name: "YouTube Blocked Our IP", iconURL: "https://cdn-icons-png.flaticon.com/512/5968/5968852.png" })
                .setDescription("YouTube has strictly blocked playing music here without login credentials.\n\n**Quick Fix:**\nTry dropping a **Spotify URL** instead of a YouTube link!");
            channel.send({ embeds: [embed] }).catch(() => { });
            return;
        }

        // Standard clean error
        const embed = new EmbedBuilder()
            .setColor("#ff3333")
            .setTitle("Playback Error")
            .setDescription(`\`\`\`\n${errStr.slice(0, 300)}\n\`\`\``);
        channel.send({ embeds: [embed] }).catch(() => { });
    });

    client.distube.on("empty", (queue) => {
        queue.textChannel?.send({ embeds: [new EmbedBuilder().setColor("#2b2d31").setDescription("👋 Voice channel is empty. Leaving...")] }).catch(() => { });
    });

    client.distube.on("finish", (queue) => {
        queue.textChannel?.send({ embeds: [new EmbedBuilder().setColor("#2b2d31").setDescription("🏁 Queue finished! Add more songs to continue.")] }).catch(() => { });
    });

    client.distube.on("disconnect", (queue) => {
        queue.textChannel?.send({ embeds: [new EmbedBuilder().setColor("#2b2d31").setDescription("🔌 Disconnected from the voice channel.")] }).catch(() => { });
    });
};