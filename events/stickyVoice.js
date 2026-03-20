const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice");
const path = require("path");
const fastCache = require("../utils/fastCache");

/**
 * STICKY VOICE PROTOCOL
 * Ensures the bot stays in the designated 24/7 voice channels without interruption.
 */
module.exports = (client) => {
    const DB_PATH = path.join(__dirname, "../data/247.json");

    const joinVC = async (guild) => {
        const db = fastCache.get(DB_PATH);
        const channelId = db[guild.id];
        if (!channelId) return;

        try {
            const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
            if (!channel || channel.type !== 2) return;

            // Check if already connected correctly
            const existingConnection = getVoiceConnection(guild.id);
            if (existingConnection && existingConnection.joinConfig.channelId === channel.id) {
                // Connection exists and is in the right place
                if (existingConnection.state.status === VoiceConnectionStatus.Ready) return;
            }

            console.log(`🔊 [StickyVoice] Re-joining ${channel.name} in ${guild.name}...`);
            
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: true
            });

            connection.on('error', (err) => {
                if (err.message.includes("IP discovery")) return;
                console.error(`🔊 [VoiceError] ${guild.name}:`, err.message);
            });

        } catch (e) {
            console.error(`🔊 [StickyVoice Error] ${guild.name}:`, e.message);
        }
    };

    // 1. INITIAL JOIN ON READY
    client.once("ready", () => {
        console.log("🔊 [StickyVoice] Initializing 24/7 Voice Protocol...");
        setTimeout(async () => {
            for (const guild of client.guilds.cache.values()) {
                await joinVC(guild);
                // Human-like delay to prevent socket flooding
                await new Promise(r => setTimeout(r, 1500));
            }
        }, 5000);
    });

    // 2. DISCONNECT PROTECTION (VOICE STATE UPDATE)
    client.on("voiceStateUpdate", async (oldState, newState) => {
        // Only trigger for the bot itself
        if (newState.member.id !== client.user.id) return;

        const db = fastCache.get(DB_PATH);
        const channelId = db[newState.guild.id];
        if (!channelId) return;

        // If disconnected or moved to a different channel
        if (!newState.channelId || newState.channelId !== channelId) {
            console.log(`🔊 [StickyVoice] Unauthorized disconnect/move detected in ${newState.guild.name}. Restoring...`);
            
            // Short delay before re-joining to avoid loop if channel is deleted
            setTimeout(() => {
                joinVC(newState.guild);
            }, 3000);
        }
    });

    // 3. PERIODIC INTEGRITY CHECK (Every 5 minutes)
    setInterval(async () => {
        const db = fastCache.get(DB_PATH);
        for (const [guildId, channelId] of Object.entries(db)) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;
            
            const connection = getVoiceConnection(guildId);
            if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) {
                await joinVC(guild);
            }
        }
    }, 300000);
};
