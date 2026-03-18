const { PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle, EmbedBuilder } = require("discord.js");

const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
  name: "ban",
  description: "Ban a member with a premium V2 interface",
  permissions: [PermissionsBitField.Flags.BanMembers],

  async execute(message, args) {
    const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
    const isServerOwner = message.guild.ownerId === message.author.id;

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      return message.reply("⚠️ **Missing User.** Usage: `!ban @user [reason]`");
    }

    if ((member.id === BOT_OWNER_ID || member.id === BOT_DEV_ID) || member.id === message.guild.ownerId) {
      return message.reply({
        content: null, components: [
          V2.container([
            V2.section(
              [
                "⚠️ PATHETIC ATTEMPT DETECTED",
                `Did you seriously just try to ban ${(member.id === BOT_OWNER_ID || member.id === BOT_DEV_ID) ? "a **System Architect**" : "the **Server Owner**"}?`
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
        content: null, embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ SELF-TERMINATION DENIED").setDescription("I cannot ban myself. I am the system.").setFooter({ text: "interX • Security" }).setTimestamp()]
      });
    }

    if (!isBotOwner && !isServerOwner && member.roles.highest.position >= message.member.roles.highest.position) {
      return message.reply("❌ You cannot ban a user with an **equal or higher role**.");
    }

    if (member.roles.highest.position >= message.guild.members.me.roles.highest.position) {
      return message.reply("❌ I cannot ban this user (Hierarchy error).");
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    // ───── CONFIRMATION V2 ─────
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ban_yes").setLabel("Confirm Ban").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ban_no").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
    );

    const confirmContainer = V2.container([
      V2.section(
        [
          "⚖️ JUDICIAL REVIEW REQUIRED",
          `Are you sure you want to permanently expel **${member.user.tag}**?\n**Reason:** ${reason}`
        ],
        member.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
      ),
      confirmRow
    ]); // Red for danger/ban confirmation

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

      if (interaction.customId === "ban_no") {
        return confirmMsg.delete().catch(() => { });
      }

      // ───── EXECUTION ─────
      try {
        const banNotice = V2.container([
          V2.section(
            [
              "⛔ OFFICIAL BAN NOTICE",
              `You have been permanently banned from **${message.guild.name}**.`
            ],
            message.client.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
          ),
          "📝 REASON FOR TERMINATION",
          `> ${reason}`,
          `**Moderator:** ${message.author.tag}\n**Date:** ${new Date().toLocaleDateString()}`
        ]); // Blue for Ban (User Request)

        await member.send({
          content: null,
          components: [banNotice]
        }).catch(() => { });
        await member.ban({ reason });

        const verdictContainer = new EmbedBuilder().setColor(0xFF0033).setTitle("⚖️ VERDICT EXECUTED").setDescription(`🔹 **Offender:** ${member.user.tag}\n🔹 **Magistrate:** ${message.author}\n🔹 **Status:** Terminated`).addFields({ name: "📜 SYSTEM LOG", value: `> **Reason:** ${reason}\n> **Time:** ${new Date().toLocaleTimeString()}` }).setFooter({ text: "interX • Security" }).setTimestamp();

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
