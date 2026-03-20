const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/invitelogger.json");

module.exports = {
    name: "invitelogger",
    description: "Configure the invite logging channel.",
    aliases: ["invlog", "setinvitelog"],
    usage: "!invitelogger <#channel/off>",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        // Ensure data directory exists
        const dataDir = path.join(__dirname, "../data");
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

        let data = {};
        if (fs.existsSync(DB_PATH)) {
            data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
        }

        const sub = args[0]?.toLowerCase();

        if (sub === "off") {
            delete data[message.guild.id];
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
            return message.reply({ content: "✅ **Invite logging has been disabled.**" });
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setAuthor({ name: "interX INVITE LOGGER SETUP", iconURL: message.client.user.displayAvatarURL() })
                .setDescription(
                    `Configure where invite logs are sent.\n\n` +
                    `> **Status:** ${data[message.guild.id]?.channel ? `<#${data[message.guild.id].channel}>` : "`Disabled`"}\n\n` +
                    `**USAGE:**\n` +
                    `> \`!invitelogger #channel\` — Enable logs in a channel\n` +
                    `> \`!invitelogger off\` — Disable logging`
                )
                .setFooter({ text: "interX Security • Module: Invite Logger" })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        data[message.guild.id] = { channel: channel.id };
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

        const success = new EmbedBuilder()
            .setColor("#df0000")
            .setAuthor({ name: "CONFIGURATION UPDATED", iconURL: message.guild.iconURL({ dynamic: true }) })
            .setDescription(`✅ **Successfully set invite logging to ${channel}!**`)
            .setFooter({ text: "interX Security • Module: Invite Logger" })
            .setTimestamp();

        return message.reply({ embeds: [success] });
    }
};
