const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "vunmuteall",
    description: "Unmute EVERYONE in your voice channel",
    usage: "!vunmuteall",
    permissions: [PermissionsBitField.Flags.MuteMembers],

    async execute(message, args) {
        const isBotOwner = (message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID);
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Administrator privileges required." });
        }

        const channel = message.member.voice.channel;
        if (!channel) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000") // Red for errors
                .setDescription("⚠️ **Voice Sync Error:** You must be connected to a voice channel to restore signals.");
            return message.reply({ embeds: [errorEmbed] });
        }

        const members = channel.members.filter(m => !m.user.bot && m.voice.serverMute);

        if (members.size === 0) {
            return message.reply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("⚠️ **Status:** No muted targets found for reactivation.")] });
        }

        const statusEmbed = new EmbedBuilder()
            .setColor("#FF0000") // Explicitly Red for interX theme
            .setAuthor({ name: "interX Sovereign Unmute", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("🔊 [ RE-SYNCING_SIGNALS ]")
            .setDescription(`> **Target Channel:** ${channel.name}\n> **Payload:** \`${members.size}\` Members\n\n*Restoring carrier frequency...*`)
            .setTimestamp();

        const statusMsg = await message.reply({ embeds: [statusEmbed] });

        // TURBO MASS UNMUTE
        const unmuteTasks = Array.from(members.values()).map(member =>
            member.voice.setMute(false, "Mass Unmute Protocol Executed").catch(() => { })
        );

        await Promise.allSettled(unmuteTasks);

        const finalEmbed = new EmbedBuilder()
            .setColor("#FF0000") // Redified for Consistency
            .setAuthor({ name: "interX Sovereign Control", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("🔊 [ MASS_RECONNECT_SUCCESS ]")
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `### **Voice Node Restored**\n\n` +
                `> **Channel:** <#${channel.id}>\n` +
                `> **Total Unmuted:** \`${members.size}\` Members\n` +
                `> **Status:** All signals re-established.\n\n` +
                `**Authority:** ${message.author}`
            )
            .setFooter({ text: "interX Sovereign • Connection Stable" })
            .setTimestamp();

        await statusMsg.edit({ embeds: [finalEmbed] });
    }
};
