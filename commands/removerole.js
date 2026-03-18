const { EMBED_COLOR, BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "removerole",
    description: "Remove a role from a user",
    usage: "!removerole @User @Role",
    permissions: [PermissionsBitField.Flags.ManageRoles],



    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 PERMISSION DENIED").setDescription("I do not have the `Manage Roles` permission.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        const member = message.mentions.members.first();
        let role = message.mentions.roles.first();

        // Safe Role Lookup
        if (!role && args.length > 1) {
            const roleQuery = args.slice(1).join(" ");
            const roleIdMatch = roleQuery.match(/(\d{17,20})/);
            const roleId = roleIdMatch ? roleIdMatch[1] : null;

            if (roleId) role = await message.guild.roles.fetch(roleId).catch(() => null);
            if (!role) role = message.guild.roles.cache.get(roleQuery);
            if (!role) role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleQuery.toLowerCase());
            if (!role) role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleQuery.toLowerCase()));
        }

        if (!member || !role) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ INVALID USAGE").setDescription("Usage: `!removerole @User @Role`").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        if (!member.roles.cache.has(role.id)) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("ℹ️ ROLE NOT FOUND").setDescription("User does not have this role.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        // CRITICAL: Bot's hierarchy check cannot be bypassed.
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 BOT HIERARCHY ERROR").setDescription("I cannot remove this role because it is **higher than or equal to** my highest role.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        // User hierarchy check (Bypassable by Owner)
        if (!isBotOwner && !isServerOwner && message.member.roles.highest.position <= role.position) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 PERMISSION DENIED").setDescription("You cannot manage a role that is higher than or equal to your own.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        try {
            await member.roles.remove(role);

            const container = V2.container([
                V2.section([
                    "🛡️ CLEARANCE REVOKED",
                    `**Access Privileges Retracted.**\nThe user **${member.user.username}** has been stripped of a role.`
                ], message.client.user.displayAvatarURL()), // Bot PFP
                "👤 OPERATIVE",
                `> **Name:** ${member.user.tag}\n> **ID:** \`${member.id}\``,
                "🛡️ REVOKED ROLE",
                `> **Role:** ${role.name}\n> **ID:** \`${role.id}\``,
                `*interX Personnel Management • ${new Date().toLocaleTimeString()}*`
            ]); // Personnel privileges retracted

            return message.channel.send({ content: null, components: [container] });

        } catch (err) {
            console.error(err);
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("❌ SYSTEM ERROR").setDescription("Failed to remove role. Please check permissions.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }
    }
};
