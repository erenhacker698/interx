const { EmbedBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const fastCache = require("../utils/fastCache");
const path = require("path");

module.exports = {
  name: "join",
  aliases: ["j", "connect"],
  description: "Join your current voice channel and set it as 24/7 Sticky VC",
  
  async execute(message, args, client) {
    const DB_PATH = path.join(__dirname, "../data/247.json");
    
    // 1. Check if user is in a VC
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({
        components: [V2.container(["⚠️ **Error:** You must be in a voice channel for me to join!"])]
      });
    }

    // 2. Check Permissions
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("Connect") || !permissions.has("Speak")) {
      return message.reply({
        components: [V2.container(["🚫 **Access Denied:** I don't have permission to join or speak in that channel!"])]
      });
    }

    try {
      // 3. Update Sticky Voice Database (FastCache)
      const db = fastCache.get(DB_PATH);
      db[message.guild.id] = voiceChannel.id;
      fastCache.set(DB_PATH, db);

      // 4. Force Join immediately
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });

      return message.reply({
        components: [V2.container([
          V2.section([
            V2.heading("Sticky Voice Protocol: Active", 3),
            `🛰️ Secured location: **${voiceChannel.name}**\n` +
            `🏰 Type: **24/7 Persistence**\n\n` +
            `> *\"I am now anchored to this sector. I will auto-reconnect if anyone tries to move or kick me.\"*`
          ], message.client.user.displayAvatarURL())
        ])]
      });

    } catch (error) {
      console.error("Join Command Error:", error);
      return message.reply({
        components: [V2.container(["❌ **Neural Error:** Could not finalize voice connection."])]
      });
    }
  }
};
