const { PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle, EmbedBuilder } = require("discord.js");

const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

function parseDuration(input) {
  // Support "10m", "10 m", "10" (default m)
  const match = input.match(/^(\d+)\s*(m|h|d|s)?$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = (match[2] || "m").toLowerCase(); // Default to minutes if unit missing
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}

module.exports = {
  name: "timeout",
  description: "Timeout a member with a premium V2 interface",
  permissions: [PermissionsBitField.Flags.ModerateMembers],

  async execute(message, args) {
    const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
    const isServerOwner = message.guild.ownerId === message.author.id;

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      return message.reply("⚠️ **Missing User.** Usage: `!timeout @user <duration> [reason]`");
    }

    if ((member.id === BOT_OWNER_ID || member.id === BOT_DEV_ID) || member.id === message.guild.ownerId) {
      return message.reply({
        content: null, components: [
          V2.container([
            V2.section(
              [
                "⚠️ PATHETIC ATTEMPT DETECTED",
                `Did you seriously just try to timeout ${(member.id === BOT_OWNER_ID || member.id === BOT_DEV_ID) ? "a **System Architect**" : "the **Server Owner**"}?`
              ],
              member.user.displayAvatarURL({ dynamic: true, size: 512 })
            ),
            `> You have no power here, ${message.author}. Know your place and step back.`,
            "*interX • Sovereign Protection*"
          ], "#FF0000")
        ]
      });
    }

    if (member.id === message.client.user.id) {
      return message.reply({
        content: null, embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ SELF-TERMINATION DENIED").setDescription("I cannot timeout myself. I am the system.").setFooter({ text: "interX • Security" }).setTimestamp()]
      });
    }

    if (!isBotOwner && !isServerOwner && member.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply("❌ You cannot timeout a user with an **equal or higher role**.");
    }

    if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ I cannot timeout this user (Hierarchy error).");
    }

    const durationInput = args[1];
    if (!durationInput) return message.reply("❌ **No duration provided.** Example: `10m`, `1h`, `1d`.");

    const durationMs = parseDuration(durationInput);
    if (!durationMs) return message.reply("❌ **Invalid duration format.** Use `m`, `h`, or `d`.");

    if (durationMs > 28 * 24 * 60 * 60 * 1000) return message.reply("❌ **Maximum timeout is 28 days.**");

    const reason = args.slice(2).join(" ") || "No reason provided";

    // ───── CONFIRMATION V2 ─────
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("timeout_yes").setLabel("Confirm Timeout").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("timeout_no").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
    );

    const confirmContainer = V2.container([
      V2.section(
        [
          "⏳ TEMPORARY CONTAINMENT",
          `Suspend communication for **${member.user.tag}**?\n**Duration:** ${durationInput}\n**Reason:** ${reason}`
        ],
        member.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
      ),
      confirmRow
    ]);

    const confirmMsg = await message.reply({
      content: null,
      components: [confirmContainer]
    });

    const collector = confirmMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 20000,
      max: 1
    });

    collector.on("collect", async interaction => {
      await interaction.deferUpdate();

      if (interaction.customId === "timeout_no") {
        return confirmMsg.delete().catch(() => { });
      }

      try {
        const timeoutNotice = V2.container([
          V2.section(
            [
              "⏳ TEMPORARY SUSPENSION",
              `You have been placed in timeout in **${message.guild.name}**.`
            ],
            message.client.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
          ),
          "📋 SUSPENSION DETAILS",
          `> **Duration:** ${durationInput}\n> **Reason:** ${reason}`,
          `**Moderator:** ${message.author.tag}\n**Date:** ${new Date().toLocaleDateString()}\n**Expiry:** In ${durationInput}`
        ]);

        await member.send({
          content: null,
          components: [timeoutNotice]
        }).catch(() => { });

        await member.timeout(durationMs, reason);

        const verdictContainer = new EmbedBuilder().setColor(0xFF0033).setTitle("⏳ CONTAINMENT ACTIVE").setDescription(`🔹 **Subject:** ${member.user.tag}\n🔹 **Duration:** ${durationInput}\n🔹 **Enforcer:** ${message.author}`).addFields({ name: "📜 INCIDENT LOG", value: `> **Reason:** ${reason}\n> **Release:** In ${durationInput}` }).setFooter({ text: "interX • Security" }).setTimestamp();

        await message.channel.send({
          content: null,
          components: [verdictContainer]
        });

      } catch (err) {
        console.error(err);
        await message.channel.send("❌ **Execution Failed:** Check bot permissions.");
      }

      confirmMsg.delete().catch(() => { });
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") confirmMsg.delete().catch(() => { });
    });
  }
};
