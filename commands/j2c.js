const { 
    PermissionsBitField, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../data/tempvc_config.json");

module.exports = {
    name: "j2c",
    aliases: ["join2create", "setupvtc"], // Maintain compatibility
    description: "Launch the interX Join-to-Create Voice Infrastructure.",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Administrator privileges required." });
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("❌ VOICE_PROTOCOL_ERROR")
                .setDescription("> **You must be connected to the target 'Join to Create' voice channel to initialize the generator node.**")
                .setFooter({ text: "interX • System Diagnostic" });
            return message.reply({ embeds: [errorEmbed] });
        }

        let config = {};
        if (fs.existsSync(CONFIG_PATH)) {
            try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")); } catch (e) { }
        }

        config[message.guild.id] = { 
            generatorId: voiceChannel.id, 
            controlChannelId: message.channel.id 
        };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        const successEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setAuthor({ name: "interX Voice Infrastructure", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("⚙️ [ J2C_GENERATOR_INITIALIZED ]")
            .setDescription(
                `### **Voice Protocol Online**\n\n` +
                `> **Generator VC:** ${voiceChannel.name} (\`${voiceChannel.id}\`)\n` +
                `> **Command Console:** ${message.channel} (\`${message.channel.id}\`)\n\n` +
                `**System Logic:**\n` +
                `When a user mounts the Generator, a private temporary node will be created and the control interface will be deployed to this channel.`
            )
            .setImage("https://media.discordapp.net/attachments/1113066373738008627/1113066427840331827/Standard_4.png") // Cool tech separator if possible, or omit
            .setFooter({ text: "interX Sovereign • Optimized Audio Systems" })
            .setTimestamp();

        return message.reply({ embeds: [successEmbed] });
    }
};
