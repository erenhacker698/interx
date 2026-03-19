const { EmbedBuilder, Events } = require("discord.js");
const { BOT_OWNER_ID } = require("../utils/bypass_system");

module.exports = {
    name: "guildCreate",

    async execute(guild, client) {
        // Find the owner to DM
        const owner = await client.users.fetch(BOT_OWNER_ID).catch(() => null);
        if (!owner) return console.warn(`[JoinNotify] Could not find bot owner with ID ${BOT_OWNER_ID} to send join notification.`);

        // Try to find who added the bot (Audit Logs)
        let inviter = "Unknown (Audit Logs Inaccessible)";
        try {
            await guild.channels.fetch().catch(() => { });
            const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }).catch(() => null); // 28 = BOT_ADD
            const entry = auditLogs?.entries.first();
            if (entry && entry.target.id === client.user.id) {
                inviter = `${entry.executor.tag} (\`${entry.executor.id}\`)`;
            }
        } catch (e) { }

        const embed = new EmbedBuilder()
            .setColor("#FF0000") // interX Red
            .setTitle("🛡️ [ NODE_ATTACHMENT_ESTABLISHED ]")
            .setAuthor({ name: "interX Sovereign System", iconURL: client.user.displayAvatarURL() })
            .setDescription(`**A new node has been brought under the Sovereign security umbrella.** Protocol initialization is underway.`)
            .addFields(
                { name: "🏢 Server Name", value: `\`${guild.name}\``, inline: true },
                { name: "🆔 Server ID", value: `\`${guild.id}\``, inline: true },
                { name: "👥 Members", value: `\`${guild.memberCount}\``, inline: true },
                { name: "👑 Server Owner", value: `<@${guild.ownerId}> (\`${guild.ownerId}\`)`, inline: false },
                { name: "👤 Added By", value: inviter, inline: false }
            )
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }) || client.user.displayAvatarURL())
            .setFooter({ text: "interX • Sovereign Network Expansion" })
            .setTimestamp();

        try {
            await owner.send({ embeds: [embed] });
            console.log(`[JoinNotify] Notification sent to Architect for guild: ${guild.name}`);
        } catch (err) {
            console.error(`[JoinNotify] CRITICAL: Failed to DM Architect:`, err.message);
        }
    }
};
