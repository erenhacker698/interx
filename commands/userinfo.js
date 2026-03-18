const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "userinfo",
  description: "Shows a detailed and spacious user profile using Components V2",

  async execute(message, args) {
    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]) ||
      (args[0] ? null : message.member);

    if (!member) return message.reply("❌ **User not found.** Please mention a valid user or provide a valid ID.");

    const user = member.user;

    const statusMap = {
      online: "🟢 Online",
      idle: "🌙 Idle",
      dnd: "⛔ Do Not Disturb",
      offline: "⚫ Offline"
    };

    const status = member.presence?.status ? statusMap[member.presence.status] : "⚫ Offline";

    const memberType =
      message.guild.ownerId === user.id
        ? "👑 Server Owner"
        : member.permissions.has("Administrator")
          ? "🛡 Administrator"
          : "👤 Member";

    const roles = member.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position);

    const roleList = roles.map(r => r.name).join(", ") || "None";

    const createdRelative = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
    const joinedRelative = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
    const joinedFull = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;

    const container = V2.container([
      V2.section(
        [
          "👤 USER PROFILE",
          `**User:** ${user.tag}\n**ID:** \`${user.id}\`\n**Status:** ${status}`
        ],
        user.displayAvatarURL({ forceStatic: true, extension: 'png' })
      ),
      "🧩 CORE INFORMATION",
      `> **Member Type:** ${memberType}\n> **Total Roles:** ${roles.size}`,
      "🕒 TIMELINE",
      `> **Created:** ${createdRelative}\n> **Joined:** ${joinedRelative}\n> **Joined Full:** ${joinedFull}`,
      V2.heading(`🎭 ROLES (${roles.size})`, 3),
      V2.text(roleList.length > 500 ? roleList.slice(0, 500) + "..." : roleList)
    ], "#0099ff");

    message.reply({
      content: null,
      components: [container]
    });
  }
};
