const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "lock",
    description: "Lock the current channel for @everyone",
    usage: "!lock [reason]",
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
            const author = message.author || message.user;
            const everyoneRoleId = message.guild.id;

            // LOCK: Deny SendMessages for @everyone
            await message.channel.permissionOverwrites.edit(everyoneRoleId, {
                SendMessages: false
            }, { reason: `Locked by ${author.tag}: ${reason}` });

            // OPTIONAL: Ensure Owner can still talk (Explicit Allow)
            if (isBotOwner) {
                await message.channel.permissionOverwrites.edit(author.id, {
                    SendMessages: true
                });
            }

            const embed = new EmbedBuilder().setColor(0xFF0033).setTitle("🔒 CHANNEL LOCKED").setDescription(`**Status:** Lockdown Active\n**Sector:** ${message.channel.name}\n**Reason:** ${reason}`).addFields({ name: "📋 Details", value: `*interX Security Systems • ${new Date().toLocaleTimeString()}*` }).setFooter({ text: "interX • Security" }).setTimestamp();

            await message.channel.send({ content: null, embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Lock Failed:** Check bot permissions hierarchy.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
