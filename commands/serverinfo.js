const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "serverinfo",
  description: "Displays detailed information about this server",

  async execute(message) {
    const guild = message.guild;

    // Owner (Cache First)
    const ownerId = guild.ownerId;
    const ownerMember = await guild.fetchOwner().catch(() => null);
    const ownerUser = ownerMember ? ownerMember.user : await message.client.users.fetch(ownerId).catch(() => null);
    const ownerTag = ownerUser ? ownerUser.tag : "Unknown#0000";

    // Members
    const totalMembers = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = totalMembers - bots;

    // Channels
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;

    // Boosts
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostLevel = guild.premiumTier;

    // Timestamps
    const createdFull = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
    const createdRelative = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;

    message.reply({
      content: null,
      components: [
        V2.container([
          V2.section(
            [
              V2.heading(`📊 ${guild.name.toUpperCase()}`, 2),
              `**ID:** \`${guild.id}\`\n**Created:** ${createdFull}`
            ],
            guild.iconURL({ forceStatic: true, extension: 'png' }) || "https://cdn.discordapp.com/embed/avatars/0.png"
          ),
          V2.section(["🛡️ **System Protection:** Active"], message.client.user.displayAvatarURL()),
          "👑 TOP AUTHORITY",
          `> **Owner:** ${ownerTag}\n> **ID:** \`${ownerId}\``,
          "👥 POPULATION",
          `> **Total:** \`${totalMembers}\`\n> **Humans:** \`${humans}\`\n> **Bots:** \`${bots}\``,
          "💬 INFRASTRUCTURE",
          `> **Text Channels:** \`${textChannels}\`\n> **Voice Channels:** \`${voiceChannels}\`\n> **Total:** \`${textChannels + voiceChannels}\``,
          "🚀 BOOST STATUS",
          `> **Level:** \`${boostLevel}\`\n> **Count:** \`${boostCount}\``,
          `*Requested by ${message.author.tag}*`
        ], "#0099ff")
      ]
    });
  }
};
