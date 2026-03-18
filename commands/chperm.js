const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { EMBED_COLOR, SUCCESS_COLOR, ERROR_COLOR } = require("../config");

module.exports = {
    name: "chperm",
    description: "Modify channel permissions for a user or role.",
    usage: "!chperm <@role|@user> <allow|deny|neutral|default> <view|send|connect|all>",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    aliases: ["cp", "perm"],

    async execute(message, args) {
        if (args.length < 3) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setDescription("⚠️ **Usage:** `!chperm <target> <allow|deny|default> <permission>`\n\n**Perms:** `view`, `send`, `connect`, `all`")]
            });
        }

        const target = message.mentions.roles.first() || message.mentions.members.first() || await message.guild.roles.fetch(args[0]).catch(() => null) || await message.guild.members.fetch(args[0]).catch(() => null);

        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setDescription("❌ Target (User/Role) not found.")] });
        }

        const action = args[1].toLowerCase();
        const permType = args[2].toLowerCase();

        // Mapping string to PermissionFlagBits
        let permsToChange = [];

        if (permType === "view") permsToChange.push(PermissionsBitField.Flags.ViewChannel);
        else if (permType === "send") permsToChange.push(PermissionsBitField.Flags.SendMessages);
        else if (permType === "connect") permsToChange.push(PermissionsBitField.Flags.Connect);
        else if (permType === "all") {
            permsToChange.push(PermissionsBitField.Flags.ViewChannel);
            permsToChange.push(PermissionsBitField.Flags.SendMessages);
            permsToChange.push(PermissionsBitField.Flags.Connect);
        } else {
            return message.reply({ embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setDescription("❌ Invalid Permission Type. Use: `view`, `send`, `connect`, `all`.")] });
        }

        let overwriteObj = {};
        if (action === "allow") {
            permsToChange.forEach(p => overwriteObj[p] = true);
        } else if (action === "deny") {
            permsToChange.forEach(p => overwriteObj[p] = false);
        } else if (action === "default" || action === "neutral") {
            permsToChange.forEach(p => overwriteObj[p] = null);
        } else {
            return message.reply({ embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setDescription("❌ Invalid Action. Use: `allow`, `deny`, `default`.")] });
        }

        try {
            await message.channel.permissionOverwrites.edit(target.id, overwriteObj);

            const { AttachmentBuilder } = require("discord.js");
            const lockIcon = new AttachmentBuilder("./assets/lock.png", { name: "lock.png" });

            const container = V2.container([
                V2.section([
                    "🔒 PERMISSIONS UPDATED",
                    `Successfully modified access protocols for **${target.name || target.user.tag}** in ${message.channel}.`
                ], "attachment://lock.png"), // Premium Blue Lock
                "⚖️ CONFIGURATION",
                `> **Action:** ${action.toUpperCase()}\n> **Permission:** ${permType.toUpperCase()}`,
                `> **Authorized By:** ${message.author}\n> **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:f>`,
                "*interX • Security Architecture*"
            ], "#cc1717");

            message.channel.send({ content: null, files: [lockIcon], components: [container] });

        } catch (err) {
            console.error(err);
            message.reply({ embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setDescription("❌ Failed to update permissions.")] });
        }
    }
};
