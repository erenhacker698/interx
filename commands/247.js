const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/247.json");

module.exports = {
    name: "247",
    aliases: ["vcstay", "alwayson"],
    description: "Toggle 24/7 VC mode for the current voice channel",
    usage: "!247 | !247 off",

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Only the **Bot Owner** can manage 24/7 settings."])] });
        }

        let db = {};
        if (fs.existsSync(DB_PATH)) { try { db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { } }

        if (args[0]?.toLowerCase() === "off") {
            if (!db[message.guild.id]) return message.reply({ components: [V2.container(["ℹ️ **24/7 mode is already disabled.**"])] });
            delete db[message.guild.id];
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            const conn = require("@discordjs/voice").getVoiceConnection(message.guild.id);
            if (conn) conn.destroy();
            return message.reply({ components: [V2.container(["✅ **24/7 Mode Disabled.** The bot will no longer stay in voice channels."])] });
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply({ components: [V2.container(["⚠️ **Please join a voice channel first!**"])] });

        db[message.guild.id] = voiceChannel.id;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

        try {
            const { joinVoiceChannel } = require("@discordjs/voice");
            joinVoiceChannel({ channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: false, selfMute: true });
        } catch (e) { console.error("24/7 Join Error:", e); }

        return message.reply({
            components: [V2.container([
                V2.section([
                    "🔊 24/7 VC ENABLED",
                    `The bot will now stay in **${voiceChannel.name}** permanently.\n\n> *Persistence active. Auto-reconnection enabled.*`
                ], message.client.user.displayAvatarURL()),
                "*Use `!247 off` to disable.*"
            ])]
        });
    }
};
