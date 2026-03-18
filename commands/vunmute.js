const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "vunmute",
    description: "Server unmute a member in Voice Channel",
    usage: "!vunmute @user",
    permissions: [PermissionsBitField.Flags.MuteMembers],

    async execute(message, args) {
        // Owner Bypass & Perms
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **Security Alert:** Access Denied. Mute permissions required.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Invalid Target:** Specify a valid user to voice-unmute.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (!target.voice.channel) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Action Failed:** The target is currently not in a voice channel.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try {
            await target.voice.setMute(false, `Unmuted by ${message.author.tag}`);

            const container = V2.container([
                V2.section([
                    "🔊 VOICE SERVER UNMUTE",
                    `**Target:** ${target}\n**Channel:** ${target.voice.channel.name}\n**Status:** \`UNMUTED\``
                ], target.user.displayAvatarURL({ dynamic: true, size: 512 })),
                `> **Authorized By:** ${message.author}`,
                "*interX • Voice Security protocol*"
            ]);

            message.reply({ content: null, components: [container] });
        } catch (e) {
            message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("See details below.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
