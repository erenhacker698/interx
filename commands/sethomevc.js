const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/247.json");

module.exports = {
    name: "sethomevc",
    aliases: ["shvc"],
    description: "Sets the home voice channel for the bot (Bot Owner Only)",
    usage: "!sethomevc | !sethomevc off",

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID))
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Only the **Bot Owner** can manage Home VC settings."])] });

        let db = {};
        if (fs.existsSync(DB_PATH)) { try { db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { } }

        if (args[0]?.toLowerCase() === "off") {
            if (!db[message.guild.id]) return message.reply({ components: [V2.container(["ℹ️ **Home VC is already disabled.**"])] });
            delete db[message.guild.id];
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            const conn = require("@discordjs/voice").getVoiceConnection(message.guild.id);
            if (conn) conn.destroy();
            return message.reply({ components: [V2.container(["✅ **Home VC Disabled.** The bot will no longer persist in this channel."])] });
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply({ components: [V2.container(["⚠️ **Please join a voice channel first!**"])] });

        db[message.guild.id] = voiceChannel.id;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

        try {
            const { joinVoiceChannel } = require("@discordjs/voice");
            joinVoiceChannel({ channelId: voiceChannel.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator, selfDeaf: false, selfMute: true });
        } catch (e) { console.error("Home VC Join Error:", e); }

        return message.reply({
            components: [V2.container([
                V2.section([
                    "🏠 HOME VC SET",
                    `The bot will now permanently reside in **${voiceChannel.name}**.\n\n> *Persistence active. Auto-reconnection enforced.*\n> Use \`!sethomevc off\` to disable.`
                ], message.client.user.displayAvatarURL())
            ])]
        });
    }
};
