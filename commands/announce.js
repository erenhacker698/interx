const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "announce",
    description: "Make an official server announcement",
    usage: "!announce <message>",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 PERMISSION DENIED").setDescription("I do not have permission to manage messages.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        if (args.length === 0) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ MISSING CONTENT").setDescription("Usage: `!announce <message>`").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        // Delete command message
        message.delete().catch(() => { });

        const announcement = args.join(" ");

        const container = V2.container([
            V2.section([
                "📢 SYSTEM WIDE BROADCAST",
                "**Incoming Transmission:**"
            ], message.client.user.displayAvatarURL()), // Bot PFP as requested
            "```fix\n" + announcement + "\n```", // Keep fix block for color
            "ℹ️ TRANSMISSION DATA",
            `> **Origin:** \`${message.author.tag}\`\n> **Priority:** \`CRITICAL / HIGH\`\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            `*interX Global Systems • Verification: 0x${Math.floor(Math.random() * 10000).toString(16).toUpperCase()}*`
        ]); // Blue as requested

        return message.channel.send({ content: null, components: [container] });
    }
};
