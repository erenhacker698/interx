const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = {
    name: "guildMemberAdd",

    async execute(member) {

        if (!member.user.bot) return;

        const logs = await member.guild.fetchAuditLogs({
            type: AuditLogEvent.BotAdd,
            limit: 1
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const executor = entry.executor;

        if (executor.id === config.ownerId) return;

        await member.kick("Unauthorized Bot");

        const logChannel = member.guild.channels.cache.get(config.logChannel);

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🤖 BOT ADD BLOCKED")
            .setDescription(`${executor} tried adding a bot.`)
            .addFields(
                { name: "Bot", value: member.user.tag, inline: true },
                { name: "Action", value: "Bot Kicked", inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });

    }
}