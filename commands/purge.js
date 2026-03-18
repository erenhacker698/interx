const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
module.exports = {
  name: "purge",
  description: "Bulk delete messages with a premium V2 interface",
  permissions: [PermissionsBitField.Flags.ManageMessages],
  aliases: ["clear", "cls"],

  async execute(message, args) {
    const botAvatar = message.client.user.displayAvatarURL();
    const dangerIcon = "https://cdn-icons-png.flaticon.com/512/564/564619.png";

    // ───── CASE 1: NO ARGUMENT → CONFIRMATION V2 ─────
    if (args.length === 0) {
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("purge_yes").setLabel("Confirm Wipe").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("purge_no").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
      );

      const confirmContainer = V2.container([
        V2.section(
          [
            "🧨 CHANNEL WIPE PROTOCOL",
            "No quantity specified. Initiate full purge of all recent cached messages (up to 100)?\n\n**Warning:** This action is irreversible."
          ],
          dangerIcon
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

        if (interaction.customId === "purge_no") {
          return confirmMsg.delete().catch(() => { });
        }

        try {
          const messages = await message.channel.messages.fetch({ limit: 100 });
          await message.channel.bulkDelete(messages, true);

          const done = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🧹 PURGE COMPLETE").setDescription(`Successfully sanitized the channel core.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
          setTimeout(() => done.delete().catch(() => { }), 3000);

        } catch (err) {
          console.error(err);
          await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Cleanup Interrupted:** Some messages may be too old for bulk deletion.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        confirmMsg.delete().catch(() => { });
      });

      collector.on("end", (_, reason) => {
        if (reason === "time") confirmMsg.delete().catch(() => { });
      });

      return;
    }

    // ───── CASE 2: NUMBER PROVIDED → IMMEDIATE DELETE ─────
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Invalid quantity.** Please specify a number between 1 and 100.").setFooter({ text: "interX • Security" }).setTimestamp()] });
    }

    try {
      await message.channel.bulkDelete(amount, true);
      const done = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🧹 PURGE COMPLETE").setDescription(`Successfully cleared **${amount}** messages.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
      setTimeout(() => done.delete().catch(() => { }), 3000);
    } catch (error) {
      console.error(error);
      message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Cleanup failed.** Message age limit reached (14 days).").setFooter({ text: "interX • Security" }).setTimestamp()] });
    }
  }
};
