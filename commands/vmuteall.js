const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "vmuteall",
    description: "Mute EVERYONE in your voice channel (except bots/immune)",
    usage: "!vmuteall",
    permissions: [PermissionsBitField.Flags.MuteMembers],

    async execute(message, args) {
        const isBotOwner = (message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID);
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Administrator privileges required." });
        }

        const channel = message.member.voice.channel;
        if (!channel) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setDescription("⚠️ **Voice Sync Error:** You must be connected to a voice channel to deploy mass-mute protocols.");
            return message.reply({ embeds: [errorEmbed] });
        }

        const members = channel.members.filter(m => !m.user.bot && m.id !== BOT_OWNER_ID && m.id !== BOT_DEV_ID && m.id !== message.author.id);

        if (members.size === 0) {
            return message.reply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("⚠️ **Status:** No authorized targets found for muting.")] });
        }

        const statusEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setAuthor({ name: "interX Sovereign Mute", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("🔇 [ INITIALIZING_MASS_MUTE ]")
            .setDescription(`> **Target Channel:** ${channel.name}\n> **Payload:** \`${members.size}\` Members\n\n*Deploying signal jamming...*`)
            .setTimestamp();

        const statusMsg = await message.reply({ embeds: [statusEmbed] });

        // TURBO MASS MUTE
        const muteTasks = Array.from(members.values()).map(member =>
            member.voice.setMute(true, "Mass Mute Protocol Executed").catch(() => { })
        );

        await Promise.allSettled(muteTasks);

        const finalEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setAuthor({ name: "interX Sovereign Control", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("🔇 [ MASS_MUTE_SUCCESS ]")
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `### **Voice Node Isolated**\n\n` +
                `> **Channel:** <#${channel.id}>\n` +
                `> **Total Muted:** \`${members.size}\` Members\n` +
                `> **Status:** All targets silenced.\n\n` +
                `**Authority:** ${message.author}`
            )
            .setFooter({ text: "interX Sovereign • Signal Dominance" })
            .setTimestamp();

        await statusMsg.edit({ embeds: [finalEmbed] });
    }
};
