const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "rolecopy",
    description: "Copy permissions from one role to another",
    usage: "!rolecopy <targetRole> <sourceRole>",
    permissions: [PermissionsBitField.Flags.ManageRoles],

    async execute(message, args) {
        if (args.length < 2)
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("Operation processed.").setFooter({ text: "interX • Security" }).setTimestamp()] });

        const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        const sourceRole = message.mentions.roles.filter(r => r.id !== targetRole?.id).first() || message.guild.roles.cache.get(args[1]);

        if (!targetRole || !sourceRole)
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("Operation processed.").setFooter({ text: "interX • Security" }).setTimestamp()] });

        if (targetRole.position >= message.guild.members.me.roles.highest.position)
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("Operation processed.").setFooter({ text: "interX • Security" }).setTimestamp()] });

        try {
            await targetRole.setPermissions(sourceRole.permissions.bitfield, `Permissions copied from ${sourceRole.name} by ${message.author.tag}`);
            message.reply({
                embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("Operation processed.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        } catch (err) {
            message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("Operation processed.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
