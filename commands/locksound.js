const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "locksound",
    description: "Lock the soundboard in the current channel",
    usage: "!locksound",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    async execute(message) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { UseSoundboard: false, UseExternalSounds: false });
            await message.reply({ components: [V2.container([`🔇 **Soundboard Locked** in ${message.channel}.\nMembers can no longer play sounds in this channel.`])] });
        } catch (err) {
            message.reply({ components: [V2.container(["❌ Failed to lock soundboard. Check my permissions."])] });
        }
    }
};
