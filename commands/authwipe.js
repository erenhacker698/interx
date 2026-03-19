const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "authwipe",
    description: "Forcefully purge all security roles from the node",
    aliases: ["aw", "wipeauth"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const clientUser = message.client.user;
        const guild = message.guild;

        const roleNames = [
            "interX!",
            "interX! anti nuke",
            "interX! unbypassable",
            "interX! secure",
            "interX! anti raid"
        ];

        const msg = await message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🗑️ INITIATING GLOBAL PURGE").setDescription("Fetching all node roles for decommissioning...").setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        try {
            // 1. Use cache to avoid rate limitations
            const allRoles = guild.roles.cache;
            let totalDeleted = 0;
            const wipeLogs = [];

            // 2. Loop through role names and find ALL instances in cache
            for (const name of roleNames) {
                const matching = allRoles.filter(r => r.name === name);
                if (matching.size > 0) {
                    wipeLogs.push(`🔹 Found **${matching.size}** instances of \`${name}\``);
                    for (const [id, role] of matching) {
                        try {
                            await role.delete("Global Security Purge Protocol");
                            totalDeleted++;
                        } catch (e) {
                            wipeLogs.push(`❌ Failed to delete instance of \`${name}\``);
                        }
                    }
                }
            }

            const completeContainer = V2.container([
                V2.section([
                    "✅ GLOBAL PURGE COMPLETE",
                    `**Decommissioning Successful.**\nSuccessfully dissolved **${totalDeleted}** security role instances.`
                ], clientUser.displayAvatarURL()),
                V2.text(wipeLogs.join("\n") || "*No residual security roles were found on the node.*"),
                `*Status: NODE_CLEANSED • Architect Mode*`
            ]);

            await msg.edit({ components: [completeContainer] });

        } catch (err) {
            console.error(err);
            await msg.edit({
                components: [V2.container(["❌ **CRITICAL_FAULT:** Failed to execute global purge."])]
            });
        }
    }
};
