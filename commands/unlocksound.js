const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "unlocksound",
    description: "Unlock the soundboard in the current channel",
    usage: "!unlocksound",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    async execute(message) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { UseSoundboard: true, UseExternalSounds: true });
            await message.reply({ components: [V2.container([`🔊 **Soundboard Unlocked** in ${message.channel}.\nMembers can now play sounds again.`])] });
        } catch (err) {
            message.reply({ components: [V2.container(["❌ Failed to unlock soundboard. Check my permissions."])] });
        }
    }
};
