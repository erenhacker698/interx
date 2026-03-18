const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config.json");

const tracker = new Map();

module.exports = {
    name: "guildBanAdd",

    async execute(ban) {

        const guild = ban.guild;

        const logs = await guild.fetchAuditLogs({
            type: AuditLogEvent.MemberBanAdd,
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

        if (data.count >= config.banLimit) {

            const member = guild.members.cache.get(executor.id);

            if (config.punishment === "ban") {
                await member.ban({ reason: "Mass Ban Attempt" });
            } else {
                await member.kick("Mass Ban Attempt");
            }

            const logChannel = guild.channels.cache.get(config.logChannel);

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("🚨 MASS BAN DETECTED")
                .setDescription(`User ${executor} tried mass banning members.`)
                .addFields(
                    { name: "Action Taken", value: config.punishment, inline: true },
                    { name: "User ID", value: executor.id, inline: true }
                )
                .setTimestamp();

            logChannel.send({ embeds: [embed] });

            tracker.delete(executor.id);
        }

        setTimeout(() => tracker.delete(executor.id), 10000);

    }
}