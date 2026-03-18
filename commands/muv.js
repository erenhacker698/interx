const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "muv",
    description: "Move user to Quarantine VC (The Void) or a specified channel",
    usage: "!muv @user [channel_id]",
    permissions: [PermissionsBitField.Flags.MoveMembers],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && !message.member.permissions.has(PermissionsBitField.Flags.MoveMembers))
            return message.reply({ components: [V2.container(["🚫 **Permission Denied.**"])] });

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply({ components: [V2.container(["⚠️ User not found."])] });
        if (!target.voice.channel) return message.reply({ components: [V2.container(["⚠️ User is not in a voice channel."])] });
        if ((target.id === BOT_OWNER_ID)) return message.reply({ components: [V2.container(["❌ Cannot move a System Authority."])] });

        let destChannel;
        if (args[1]) {
            destChannel = message.guild.channels.cache.get(args[1]);
        } else {
            destChannel = message.guild.channels.cache.find(c => c.name === "The Void" && c.type === ChannelType.GuildVoice);
            if (!destChannel) {
                try {
                    destChannel = await message.guild.channels.create({
                        name: "The Void",
                        type: ChannelType.GuildVoice,
                        permissionOverwrites: [{ id: message.guild.id, deny: [PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream] }]
                    });
                } catch (e) {
                    return message.reply({ components: [V2.container(["❌ Failed to create Void channel."])] });
                }
            }
        }

        if (!destChannel) return message.reply({ components: [V2.container(["⚠️ Destination channel not found."])] });

        try {
            await target.voice.setChannel(destChannel);
            message.reply({ components: [V2.container([`🚚 **${target.user.tag}** moved to **${destChannel.name}**.`])] });
        } catch (e) {
            message.reply({ components: [V2.container(["❌ Failed to move user."])] });
        }
    }
};
