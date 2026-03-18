const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "lockvc",
    description: "Lock the voice channel you are currently in for @everyone",
    usage: "!lockvc [reason]",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    aliases: ["lvc"],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const reason = args.join(" ") || "No reason provided";
        // Permission Check (Owner Bypass)
        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(V2_RED).setDescription("🚫 You do not have permission to use this command.")] });
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(V2_RED).setDescription("🚫 I do not have permission to manage channels.")] });
        }

        const channel = message.member.voice.channel;
        if (!channel) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(V2_RED).setDescription("⚠️ You must be in a voice channel to lock it.")] });
        }

        try {
            const author = message.author || message.user;

            // Lock channel for @everyone (Connect: false)
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                Connect: false
            }, { reason: `Locked by ${author.tag}: ${reason}` });

            const lockIcon = new AttachmentBuilder("./assets/lock.png", { name: "lock.png" });

            // Using global V2
            const container = V2.container([
                V2.section([
                    "🔒 VOICE CHANNEL LOCKDOWN",
                    `**Status:** \`LOCKED\`\n**Channel:** ${channel.name}\n**Target:** \`@everyone\`\n**Access:** \`Staff Only\``
                ], "https://i.ibb.co/3ykjL78Y/lock-icon.png"), // User provided lock icon
                "📂 DETAILS",
                `> **Reason:** ${reason}\n> **Authorized By:** ${author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`,
                "*interX • Voice Security Protocol*"
            ]);

            await message.channel.send({ content: null, embeds: [container.embed], files: [lockIcon] });

        } catch (err) {
            console.error(err);
            // Using global V2
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Failed to lock the voice channel.**").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
