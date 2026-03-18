const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "untimeout",
    description: "Remove timeout from a user",
    usage: "!untimeout @user [reason]",
    permissions: [PermissionsBitField.Flags.ModerateMembers],
    async execute(message, args) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply({ components: [V2.container(["⚠️ **User not found.**"])] });

        try {
            if (!target.moderatable) return message.reply({ components: [V2.container(["❌ I cannot remove the timeout from this user."])] });
            await target.timeout(null, "Untimeout command");
            message.reply({
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔊 TIMEOUT REMOVED").setDescription(`**${target.user.tag}** has been released from isolation.\n> *Actioned by ${message.author.tag}*`).setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        } catch (err) {
            message.reply({ components: [V2.container(["❌ **Failed to remove timeout.** Check my role hierarchy."])] });
        }
    }
};
