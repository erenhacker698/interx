const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "unmute",
    description: "Remove a timeout (unmute) from a user",
    usage: "!unmute @user",
    aliases: ["untimeout"],
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("🚫 **Access Denied.** You need `Moderate Members` permission.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("⚠️ **User not found.** Usage: `!unmute @user`").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (!target.moderatable) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ I cannot remove the mute from this user — they outrank me.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (!target.communicationDisabledUntil || new Date(target.communicationDisabledUntil) < new Date()) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription(`⚠️ **${target.user.tag}** is not currently muted.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try {
            await target.timeout(null, `Unmuted by ${message.author.tag}`);

            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0033)
                .setTitle("🔊 YOUR MUTE HAS BEEN REMOVED")
                .setDescription(`Your timeout in **${message.guild.name}** has been lifted.\nYou may now communicate freely.`)
                .setThumbnail(message.client.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                .addFields(
                    { name: "👮 Released by", value: message.author.tag, inline: true },
                    { name: "🕐 At", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                )
                .setFooter({ text: "interX • Moderation System" })
                .setTimestamp();

            await target.send({ embeds: [dmEmbed] }).catch(() => { });

            const embed = new EmbedBuilder()
                .setColor(0xFF0033)
                .setTitle("🔊 MUTE REMOVED")
                .setDescription(`**${target.user.tag}** has been released from silence.`)
                .setThumbnail(target.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                .addFields(
                    { name: "👮 Released by", value: message.author.tag, inline: true },
                    { name: "🕐 At", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                )
                .setFooter({ text: "interX • Moderation System" })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ **Failed to remove mute.** Check my role hierarchy.").setFooter({ text: "interX • Error" }).setTimestamp()] });
        }
    }
};
