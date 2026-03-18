const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "deleterole",
    description: "Delete a role",
    usage: "!deleterole <@role | name | id>",
    permissions: [PermissionsBitField.Flags.ManageRoles],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const botAvatar = message.client.user.displayAvatarURL();

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply({
                components: [V2.container([
                    V2.section(["🚫 MISSING PERMISSIONS", "> I do not have ManageRoles permission."], botAvatar)
                ])]
            });
        }

        if (!args[0]) {
            return message.reply({
                components: [V2.container([
                    V2.section(["⚠️ MISSING ARGUMENT", "> **Usage:** `!deleterole <@role | name | id>`"], botAvatar)
                ])]
            });
        }

        const role = message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[0]) ||
            message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(" ").toLowerCase());

        if (!role) {
            return message.reply({
                components: [V2.container([
                    V2.section(["❌ ROLE NOT FOUND", "> No role matched your input."], botAvatar)
                ])]
            });
        }

        if (!isBotOwner && !isServerOwner && role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({
                components: [V2.container([
                    V2.section(["🚫 HIERARCHY CONFLICT", `> \`${role.name}\` is above my highest role.`], botAvatar)
                ])]
            });
        }

        try {
            const roleName = role.name;
            await role.delete(`Deleted by ${message.author.tag}`);

            return message.reply({
                components: [V2.container([
                    V2.section([
                        "🗑️ ROLE PURGED",
                        `**Dissolved:** \`${roleName}\``
                    ], botAvatar),
                    `> **By:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`
                ])]
            });
        } catch (err) {
            console.error(err);
            return message.reply({
                components: [V2.container([
                    V2.section(["❌ FAILED", "> Could not delete the role."], botAvatar)
                ])]
            });
        }
    }
};
