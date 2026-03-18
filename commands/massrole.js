const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "massrole",
    description: "Mass Add/Remove a role to ALL members (Admin Only)",
    usage: "!massrole <add|remove> <@role>",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **ACCESS DENIED** | Level 5 Security Restricted to Bot Owner.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const action = args[0]?.toLowerCase();
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

        if (!["add", "remove"].includes(action) || !role) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Invalid Syntax**\nUsage: `!massrole <add|remove> <@role>`").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Hierarchy Error**: I cannot manage a role that is higher than or equal to my highest role.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const initContainer = V2.container([
            V2.section([
                V2.heading(`🔄 MASS ${action.toUpperCase()} INITIATED`, 2),
                `Processing **${message.guild.memberCount}** members...\n**Target Role:** ${role}\n> Operation in progress...`
            ], "https://cdn-icons-png.flaticon.com/512/3064/3064155.png")
        ], "#FFFF00");

        await message.reply({ content: null, components: [initContainer] });

        let successCount = 0;
        let failCount = 0;
        const members = (await message.guild.members.fetch()).filter(m => !m.user.bot);

        await Promise.all(Array.from(members.values()).map(async (member) => {
            try {
                if (action === "add" && !member.roles.cache.has(role.id)) {
                    await member.roles.add(role, "Mass Role Operation");
                    successCount++;
                } else if (action === "remove" && member.roles.cache.has(role.id)) {
                    await member.roles.remove(role, "Mass Role Operation");
                    successCount++;
                }
            } catch (err) {
                failCount++;
            }
        }));

        const finalContainer = V2.container([
            V2.section([
                V2.heading(`✅ MASS ${action.toUpperCase()} COMPLETE`, 2),
                V2.text(
                    `### **[ ROLE_UPDATE_SUCCESS ]**\n\n` +
                    `> **Target Role:** ${role}\n` +
                    `> **Processed:** \`${successCount}\` members\n` +
                    `> **Failed Linked:** \`${failCount}\` (Hierarchy/Permissions)`
                )
            ], "https://cdn-icons-png.flaticon.com/512/190/190411.png"),
            "*interX • Global Hierarchy Synced*"
        ]);

        return message.channel.send({ content: null, components: [finalContainer] });
    }
};
