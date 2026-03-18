const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "muvu",
    description: "Retrieve a user from quarantine (move to your VC)",
    usage: "!muvu @user",
    permissions: [PermissionsBitField.Flags.MoveMembers],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && !message.member.permissions.has(PermissionsBitField.Flags.MoveMembers))
            return message.reply({ components: [V2.container(["🚫 **Permission Denied.**"])] });

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply({ components: [V2.container(["⚠️ User not found."])] });
        if (!target.voice.channel) return message.reply({ components: [V2.container(["⚠️ User is not in a voice channel."])] });

        const destChannel = message.member.voice.channel;
        if (!destChannel) return message.reply({ components: [V2.container(["⚠️ **You must be in a voice channel** to pull them to you."])] });

        try {
            await target.voice.setChannel(destChannel);
            message.reply({ components: [V2.container([`🚚 **${target.user.tag}** retrieved to **${destChannel.name}**.`])] });
        } catch (e) {
            message.reply({ components: [V2.container(["❌ Failed to move user."])] });
        }
    }
};
