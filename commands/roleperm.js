const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "roleperm",
    description: "Modify role permissions (add/remove)",
    aliases: ["rperm", "editrole"],
    usage: "!roleperm <@role/ID> <add|remove> <Permission>",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if (args.length < 3)
            return message.reply({ components: [V2.container(["⚠️ **Usage:** `!roleperm <@role/ID> <add|remove> <Permission>`\n**Example:** `!roleperm @Mods add BanMembers`"])] });

        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) return message.reply({ components: [V2.container(["❌ **Role not found.**"])] });

        const action = args[1].toLowerCase();
        const permString = args[2];
        const targetPerm = PermissionsBitField.Flags[permString];

        if (!targetPerm)
            return message.reply({ components: [V2.container([`❌ **Invalid Permission:** \`${permString}\`\nExamples: \`BanMembers\`, \`KickMembers\`, \`Administrator\`, \`ManageChannels\``])] });

        if (role.position >= message.guild.members.me.roles.highest.position)
            return message.reply({ components: [V2.container(["❌ I cannot modify this role — it's above my highest role."])] });

        try {
            const currentPerms = new PermissionsBitField(role.permissions);
            let newPerms;

            if (action === "add" || action === "+") {
                if (currentPerms.has(targetPerm)) return message.reply({ components: [V2.container(["⚠️ This role **already has** that permission."])] });
                newPerms = currentPerms.add(targetPerm);
            } else if (action === "remove" || action === "-") {
                if (!currentPerms.has(targetPerm)) return message.reply({ components: [V2.container(["⚠️ This role **does not have** that permission."])] });
                newPerms = currentPerms.remove(targetPerm);
            } else {
                return message.reply({ components: [V2.container(["❌ Invalid action. Use `add` or `remove`."])] });
            }

            await role.setPermissions(newPerms);
            message.reply({
                components: [V2.container([
                    "💎 ROLE PERMISSIONS UPDATED",
                    `> **Role:** ${role}\n> **Action:** ${action === "add" ? "✅ Added" : "🔻 Removed"}\n> **Permission:** \`${permString}\`\n> **By:** ${message.author.tag}`
                ])]
            });
        } catch (err) {
            message.reply({ components: [V2.container(["❌ **Failed to update permissions.** Check my role hierarchy."])] });
        }
    }
};
