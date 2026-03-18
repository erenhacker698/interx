const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config.json");

const tracker = new Map();

module.exports = {
    name: "roleDelete",

    async execute(role) {

        const guild = role.guild;

        const logs = await guild.fetchAuditLogs({
            type: AuditLogEvent.RoleDelete,
            limit: 1
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const executor = entry.executor;
        if (executor.id === config.ownerId) return;

        if (!tracker.has(executor.id)) {
            tracker.set(executor.id, { count: 1 });
        } else {
            tracker.get(executor.id).count++;
        }

        const data = tracker.get(executor.id);

        if (data.count >= config.roleDeleteLimit) {

            const member = guild.members.cache.get(executor.id);

            await member.ban({ reason: "Role Delete Nuke Attempt" });

            const logChannel = guild.channels.cache.get(config.logChannel);

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("🛡️ ROLE DELETE PROTECTION")
                .setDescription(`${executor} attempted to delete roles.`)
                .addFields(
                    { name: "Punishment", value: "BANNED", inline: true },
                    { name: "Executor ID", value: executor.id, inline: true }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });

            tracker.delete(executor.id);

        }

        setTimeout(() => tracker.delete(executor.id), 10000);

    }
}