const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = {
  name: "guildBanAdd",
  async execute(ban) {

    const logChannel = ban.guild.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    const logs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
    const entry = logs.entries.first();

    const embed = new EmbedBuilder()
      .setColor("#8B0000")
      .setTitle("🔨 Member Banned")
      .addFields(
        { name: "User", value: `${ban.user}`, inline: true },
        { name: "User ID", value: ban.user.id, inline: true },
        { name: "Banned By", value: `${entry.executor}`, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] });

  }
};