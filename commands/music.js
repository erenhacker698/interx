const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "music",
    description: "Launch the interX high-performance music engine.",
    aliases: ["p", "play", "skip", "stop", "volume", "v", "queue", "q", "pause", "resume"],

    data: new SlashCommandBuilder()
        .setName("music")
        .setDescription("interX Music Engine Infrastructure")
        .addSubcommand(sub => 
            sub.setName("play")
               .setDescription("Stream high-fidelity audio")
               .addStringOption(opt => opt.setName("query").setDescription("Track Title or URL").setRequired(true))
        )
        .addSubcommand(sub => sub.setName("stop").setDescription("Decommission the current audio node"))
        .addSubcommand(sub => sub.setName("skip").setDescription("Bypass the current track"))
        .addSubcommand(sub => 
            sub.setName("volume")
               .setDescription("Calibrate system amplitude")
               .addIntegerOption(opt => opt.setName("amount").setDescription("Volume percentage (0-100)").setRequired(true))
        )
        .addSubcommand(sub => sub.setName("queue").setDescription("Inspect the pending track buffer")),

    async execute(message, args, client) {
        const guild = message.guild;
        const member = message.member || await guild.members.fetch(message.author.id).catch(() => null);
        if (!member) return;
        const voiceChannel = member.voice.channel;

        // Handle Slash vs Prefix (Interaction vs Message)
        let isInteraction = false;
        try { isInteraction = message.isChatInputCommand && message.isChatInputCommand(); } catch (e) {}

        let sub, query, volume;
        const inputCmd = (message.commandName || (message.content?.startsWith("!") ? message.content.slice(1).split(" ")[0].toLowerCase() : "")).toLowerCase();

        if (isInteraction) {
            sub = message.options.getSubcommand();
            query = message.options.getString("query");
            volume = message.options.getInteger("amount");
        } else {
            // Map aliases to subcommands
            if (["p", "play"].includes(inputCmd)) {
                sub = "play";
                query = args.join(" ");
            } else if (["stop", "leave"].includes(inputCmd)) {
                sub = "stop";
            } else if (["skip", "s", "n", "next"].includes(inputCmd)) {
                sub = "skip";
            } else if (["volume", "v", "vol"].includes(inputCmd)) {
                sub = "volume";
                volume = parseInt(args[0]);
            } else if (["queue", "q"].includes(inputCmd)) {
                sub = "queue";
            } else if (["music"].includes(inputCmd)) {
                sub = args[0]?.toLowerCase();
                if (sub === "play") query = args.slice(1).join(" ");
                if (sub === "volume") volume = parseInt(args[1]);
            } else if (["pause", "resume"].includes(inputCmd)) {
                sub = "pause_resume";
            }
        }

        if (!sub) {
            const helpEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("🎧 MUSIC_ENGINE_PROTOCOLS")
                .setDescription(
                    "### **Available Commands**\n" +
                    "> `!play <query>` - Initialize audio stream\n" +
                    "> `!skip` - Bypass current track\n" +
                    "> `!stop` - Terminate session\n" +
                    "> `!volume <0-100>` - Set amplitude\n" +
                    "> `!queue` - View track buffer\n\n" +
                    "*Supports YouTube, Spotify, and SoundCloud via interX Node.*"
                )
                .setFooter({ text: "interX • Audio Intelligence" });
            return message.reply({ embeds: [helpEmbed] });
        }

        if (!voiceChannel) {
            return message.reply("⚠️ **[ ACCESS_DENIED ]** You must be inside a Voice Channel to initialize audio protocols.");
        }

        const queue = client.distube.getQueue(guild.id);

        try {
            switch (sub) {
                case "play":
                    if (!query) return message.reply("❌ Specify a track title or URL.");
                    if (isInteraction) await message.reply({ content: "🔍 identifying audio sequence...", ephemeral: true }).catch(() => {});
                    
                    await client.distube.play(voiceChannel, query, {
                        member: member,
                        textChannel: message.channel,
                        message: !isInteraction ? message : null
                    });
                    break;

                case "stop":
                    if (!queue) return message.reply("❌ No active audio stream detected.");
                    queue.stop();
                    return message.reply("⏹️ **[ SESSION_TERMINATED ]** Audio node decommissioned.");

                case "skip":
                    if (!queue) return message.reply("❌ No active audio stream detected.");
                    if (queue.songs.length <= 1) return message.reply("❌ No pending tracks in the buffer to skip.");
                    await queue.skip();
                    return message.reply("⏭️ **[ TRACK_BYPASSED ]** Initializing next audio sequence.");

                case "volume":
                    if (!queue) return message.reply("❌ No active audio stream detected.");
                    if (isNaN(volume) || volume < 0 || volume > 200) return message.reply("❌ Invalid amplitude range. Specify `0-200`.");
                    queue.setVolume(volume);
                    return message.reply(`🔊 **[ AMPLITUDE_CALIBRATED ]** System volume set to \`${volume}%\`.`);

                case "queue":
                    if (!queue) return message.reply("❌ No active audio stream detected.");
                    const qEmbed = new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle("📂 [ PENDING_BUFFER_DATA ]")
                        .setDescription(queue.songs.map((song, i) => `${i === 0 ? "▶️ **Current:**" : `**${i}.**`} [${song.name}](${song.url}) - \`${song.formattedDuration}\``).slice(0, 10).join("\n"))
                        .setFooter({ text: `Tracks in Buffer: ${queue.songs.length}` });
                    return message.reply({ embeds: [qEmbed] });

                case "pause_resume":
                    if (!queue) return message.reply("❌ No active audio stream detected.");
                    if (queue.paused) {
                        queue.resume();
                        return message.reply("▶️ **[ STREAM_RESUMED ]** Audio tracking active.");
                    } else {
                        queue.pause();
                        return message.reply("⏸️ **[ STREAM_PAUSED ]** Audio transmission restricted.");
                    }
            }
        } catch (e) {
            console.error(e);
            return message.reply(`❌ **[ SYSTEM_FAULT ]** ${e.message}`);
        }
    }
};
