const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config.json");

const roleDeleteTracker = new Map();

module.exports = {
    name: "roleDelete",
    async execute(role) {

        const guild = role.guild;

        const logs = await guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.RoleDelete
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const executor = entry.executor;
        if (!executor) return;

        if (executor.id === config.ownerId) return;

        if (!roleDeleteTracker.has(executor.id)) {
            roleDeleteTracker.set(executor.id, { count: 1 });
        } else {
            roleDeleteTracker.get(executor.id).count++;
        }

        const data = roleDeleteTracker.get(executor.id);

        if (data.count >= config.roleDeleteLimit) {

            const member = guild.members.cache.get(executor.id);

            if (config.punishment === "ban") {
                await member.ban({ reason: "Role Delete Nuke Attempt" });
            } else {
                await member.kick("Role Delete Nuke Attempt");
            }

            const logChannel = guild.channels.cache.get(config.logChannelId);

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("🛡️ Role Delete Protection Triggered")
                .addFields(
                    { name: "Executor", value: `${executor}`, inline: true },
                    { name: "Action Taken", value: config.punishment, inline: true }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });

            roleDeleteTracker.delete(executor.id);

        }

        setTimeout(() => roleDeleteTracker.delete(executor.id), 10000);

    }
};