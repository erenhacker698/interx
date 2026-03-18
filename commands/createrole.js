const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "createrole",
    description: "Create a new role",
    usage: "!createrole <name> [color]",
    permissions: [PermissionsBitField.Flags.ManageRoles],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const botAvatar = message.client.user.displayAvatarURL();

        if (!isBotOwner && !isServerOwner && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply({ components: [V2.container(["🚫 **I do not have permission to manage roles.**"])] });
        }

        if (!args[0]) {
            return message.reply({ components: [V2.container(["⚠️ **Usage:** `!createrole <name> [color]`"])] });
        }

        let roleName = args.join(" ");
        let roleColor = "Default";

        const lastArg = args[args.length - 1];
        const colorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
        const commonColors = ["red", "blue", "green", "yellow", "purple", "orange", "black", "white", "grey", "gray"];

        if (args.length > 1 && (colorRegex.test(lastArg) || commonColors.includes(lastArg.toLowerCase()))) {
            roleColor = lastArg;
            roleName = args.slice(0, -1).join(" ");
        }

        try {
            const role = await message.guild.roles.create({ name: roleName, color: roleColor, reason: `Created by ${message.author.tag}` });

            return message.reply({
                components: [V2.container([
                    V2.section([
                        "✨ ROLE CONSTRUCTED",
                        `**${role.name}** has been added to the registry.`
                    ], botAvatar),
                    `> **Name:** \`${role.name}\`\n> **Color:** \`${role.hexColor}\`\n> **ID:** \`${role.id}\`\n> **Created by:** ${message.author}`
                ], role.hexColor !== "#000000" ? role.hexColor : V2_BLUE)]
            });
        } catch (err) {
            console.error(err);
            return message.reply({ components: [V2.container(["❌ **Failed to create role.** Check hierarchy or permissions."])] });
        }
    }
};
