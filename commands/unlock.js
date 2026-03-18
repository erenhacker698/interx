const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "unlock",
    description: "Unlock the current channel for @everyone",
    usage: "!unlock [reason]",
    permissions: [PermissionsBitField.Flags.ManageChannels],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const reason = args.join(" ") || "No reason provided";

        // Permission Check
        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **Access Denied:** You need `Manage Channels` permission.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **System Error:** I (Bot) need `Manage Channels` permission.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try {
            const everyoneRoleId = message.guild.id;

            // UNLOCK: Reset SendMessages for @everyone (null)
            await message.channel.permissionOverwrites.edit(everyoneRoleId, {
                SendMessages: null
            }, { reason: `Unlocked by ${message.author.tag}: ${reason}` });

            const container = V2.container([
                V2.section([
                    "🔓 CHANNEL UNLOCKED",
                    `**Status:** Access Restored\n**Sector:** ${message.channel.name}\n**Reason:** ${reason}`
                ], "https://i.ibb.co/j65q3X4/unlock-icon.png"), // User provided unlock icon
                `*interX Security Systems • ${new Date().toLocaleTimeString()}*`
            ], "#0099ff");

            await message.channel.send({ content: null, components: [container] });

        } catch (err) {
            console.error(err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Unlock Failed:** Check bot permissions hierarchy.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
