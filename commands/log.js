const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "log",
    description: "Setup or disable server logging channels.",
    aliases: ["logs", "logging", "logset"],
    permissions: [PermissionsBitField.Flags.ManageGuild],

    async execute(message, args) {
        const DB_PATH = path.join(__dirname, "../data/logs.json");
        const dataDir = path.join(__dirname, "../data");
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

        let data = {};
        if (fs.existsSync(DB_PATH)) { try { data = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch { } }

        const type = args[0]?.toLowerCase();
        const subCommand = args[1]?.toLowerCase();
        const validTypes = ["message", "mod", "verify", "whitelist", "security", "server", "role", "file", "voice", "member", "action", "channel", "invite", "ticket", "admin", "quark", "raid", "misuse"];

        if (!type || !validTypes.includes(type) || (subCommand !== "set" && subCommand !== "off")) {
            return message.reply({
                components: [V2.container([
                    "📋 UNIVERSAL LOGGING SYSTEM",
                    "Configure separate channels for specific server activities.",
                    "📝 Usage",
                    V2.text(
                        `> **Set:** \`!log <type> set #channel\`\n> **Off:** \`!log <type> off\`\n\n` +
                        `**Available Types:**\n> \`message\` \`mod\` \`server\` \`role\` \`file\` \`voice\`\n> \`member\` \`action\` \`channel\` \`invite\` \`ticket\` \`admin\`\n> \`quark\` \`raid\` \`verify\` \`whitelist\` \`security\` \`misuse\``
                    ),
                    "*interX • Logging Module*"
                ])]
            });
        }

        if (!data[message.guild.id]) data[message.guild.id] = {};

        if (subCommand === "set") {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
            if (!channel || channel.type !== 0)
                return message.reply({ components: [V2.container(["❌ **Invalid Channel:** Please mention a valid text channel."])] });

            data[message.guild.id][type] = channel.id;
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

            return message.reply({
                components: [V2.container([
                    V2.heading(`✅ ${type.toUpperCase()} LOGGING ENABLED`, 2),
                    `${type.charAt(0).toUpperCase() + type.slice(1)} logs will now be sent to ${channel}.`
                ])]
            });
        }

        if (subCommand === "off") {
            if (data[message.guild.id]?.[type]) {
                delete data[message.guild.id][type];
                fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
                return message.reply({ components: [V2.container([`🔒 **${type.toUpperCase()} Logging** has been disabled.`])] });
            }
            return message.reply({ components: [V2.container([`⚠️ **${type.toUpperCase()} logging is already disabled.**`])] });
        }
    }
};
