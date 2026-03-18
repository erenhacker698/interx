const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../data/tempvc_config.json");

module.exports = {
    name: "setupvtc",
    aliases: ["svtc"],
    description: "Sets up the Join-to-Create temporary VC system",
    usage: "!setupvtc (while in the Join VC)",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Administrator permissions required."])] });

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
            return message.reply({ components: [V2.container(["⚠️ **Please join the 'Join to Create' voice channel first!**"])] });

        let config = {};
        if (fs.existsSync(CONFIG_PATH)) { try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")); } catch (e) { } }

        config[message.guild.id] = { generatorId: voiceChannel.id, controlChannelId: message.channel.id };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

        return message.reply({
            components: [V2.container([
                "⚙️ TEMP VC SYSTEM INITIALIZED",
                V2.text(
                    `### ✅ Configuration Complete\n` +
                    `> **Generator VC:** ${voiceChannel.name} (\`${voiceChannel.id}\`)\n` +
                    `> **Control Channel:** ${message.channel} (\`${message.channel.id}\`)\n\n` +
                    `When a member joins the generator VC, a new temporary channel will be created and control buttons will appear here.`
                ),
                "*interX • Temp VC System*"
            ])]
        });
    }
};
