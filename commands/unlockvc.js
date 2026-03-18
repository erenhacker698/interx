const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "unlockvc",
    description: "Unlock the voice channel you are currently in for @everyone",
    usage: "!unlockvc",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    aliases: ["uvc"],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        // Permission Check (Owner Bypass)
        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(V2_RED).setDescription("🚫 You do not have permission to use this command.")] });
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(V2_RED).setDescription("🚫 I do not have permission to manage channels.")] });
        }

        const channel = message.member.voice.channel;
        if (!channel) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(V2_RED).setDescription("⚠️ You must be in a voice channel to unlock it.")] });
        }

        try {
            // Unlock channel for @everyone (Connect: null)
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                Connect: null
            }, { reason: `Unlocked by ${message.author.tag}` });

            const unlockIcon = new AttachmentBuilder("./assets/unlock.png", { name: "unlock.png" });

            // Using global V2
            const container = V2.container([
                V2.section([
                    "🔓 VOICE CHANNEL UNLOCKED",
                    `**Status:** \`UNLOCKED\`\n**Channel:** ${channel.name}\n**Target:** \`@everyone\`\n**Access:** \`Public Default\``
                ], "https://i.ibb.co/j65q3X4/unlock-icon.png"), // User provided unlock icon
                "📂 DETAILS",
                `> **Authorized By:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`,
                "*interX • Voice Security Protocol*"
            ]);

            await message.channel.send({ content: null, files: [unlockIcon], components: [container] });

        } catch (err) {
            console.error(err);
            // Using global V2
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Failed to unlock the voice channel.**").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
