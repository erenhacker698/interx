const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
  name: "deepclean",
  description: "☢️ DEEP SERVER CLEAN (Annihilates Channels, Roles, Emojis, etc.)",
  aliases: ["dclean", "wipeall"],
  usage: "!deepclean",
  permissions: [PermissionsBitField.Flags.Administrator],
  whitelistOnly: true,

  async execute(message, args) {
    // 1. Ownership & Permission Check
    const isBotOwner = (message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID);
    const isServerOwner = message.guild.ownerId === message.author.id;

    if (!isBotOwner && !isServerOwner) {
      return message.reply({ 
        embeds: [new EmbedBuilder()
          .setColor(0xFF0033)
          .setTitle("🚫 ACCESS DENIED")
          .setDescription("This destructive protocol is restricted to the **Server Owner** or **Lead Architects**.")
          .setFooter({ text: "interX • Security" })
          .setTimestamp()]
      });
    }

    // 2. Initial Warning Embed (Red UI)
    const confirmContainer = V2.container([
      V2.section([
        "☢️ DEEP CLEAN PROTOCOL INITIATED",
        V2.text(
          `**WARNING:** You are about to initiate a complete server sanitization.\n\n` +
          `> **Target Node:** ${message.guild.name}\n` +
          `> **Operation:** Deep Wipe (Channels, Roles, Assets)\n\n` +
          `**THIS ACTION IS IRREVERSIBLE.** All data will be purged.`
        )
      ], "https://cdn-icons-png.flaticon.com/512/564/564619.png"),
      "*interX • Sovereignty Enforcement*"
    ]);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_deep_clean")
        .setLabel("CONFIRM SANITIZATION")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("cancel_deep_clean")
        .setLabel("ABORT SEQUENCE")
        .setStyle(ButtonStyle.Secondary)
    );

    const initialReply = await message.reply({ components: [confirmContainer, row] });

    // 3. Interaction Collector
    const filter = i => i.user.id === message.author.id;
    const collector = initialReply.createMessageComponentCollector({ filter, time: 30000, max: 1 });

    collector.on("collect", async i => {
      if (i.customId === "cancel_deep_clean") {
        return i.update({ 
          embeds: [new EmbedBuilder()
            .setColor(0xFF0033)
            .setTitle("🚫 PROTOCOL ABORTED")
            .setDescription("Deep Clean sequence has been disengaged. Node remains intact.")
            .setFooter({ text: "interX • Security" })
            .setTimestamp()],
          components: []
        });
      }

      if (i.customId === "confirm_deep_clean") {
        await i.update({ 
          embeds: [new EmbedBuilder()
            .setColor(0xFF0033)
            .setTitle("💥 SANITIZATION COMMENCING")
            .setDescription("The void is approaching. Synchronizing extinction of all assets...")
            .setFooter({ text: "interX • Security" })
            .setTimestamp()],
          components: []
        });

        // 4. PREPARATION
        const guild = message.guild;
        const currentChannel = message.channel;

        try {
          // A. Delete Emojis, Stickers, Invites (Parallel)
          const assetsTasks = [];
          assetsTasks.push(...guild.emojis.cache.map(e => e.delete().catch(() => {})));
          assetsTasks.push(...guild.stickers.cache.map(s => s.delete().catch(() => {})));
          
          const invites = await guild.invites.fetch().catch(() => new Map());
          assetsTasks.push(...invites.map(inv => inv.delete().catch(() => {})));
          
          // B. Delete Roles (Filter out @everyone and managed/higher roles)
          const rolesTasks = guild.roles.cache
            .filter(r => r.id !== guild.id && r.editable && !r.managed)
            .map(r => r.delete("Deep Clean Protocol").catch(() => {}));
          
          // Executing Asset/Role deletion
          await Promise.all([...assetsTasks, ...rolesTasks]);

          // C. Delete Channels (Save current for last)
          const channels = guild.channels.cache.filter(c => c.id !== currentChannel.id);
          for (const [id, ch] of channels) {
            await ch.delete("Deep Clean Protocol").catch(() => {});
          }

          // D. Create New Beginning
          const finalChannel = await guild.channels.create({
            name: "interx-sanitized",
            type: ChannelType.GuildText,
            topic: "Server deep cleaned by interX protocol.",
            reason: "Deep Clean Protocol Reconstruction"
          });

          // E. Final Message in the New Channel
          const finalContainer = V2.container([
            V2.section([
              "✅ SANITIZATION COMPLETE",
              V2.text(
                `### 🛡️ THE NODE HAS BEEN PURIFIED\n` +
                `All traces of the previous configuration have been eliminated.\n\n` +
                `> **Cleaned By:** <@${message.author.id}>\n` +
                `> **Status:** Pristine\n` +
                `> **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`
              )
            ], V2.botAvatar(message))
          ]);

          await finalChannel.send({ components: [finalContainer] });

          // F. Self-Destruct the old channel last
          await currentChannel.delete("Deep Clean Protocol Final Stage").catch(() => {});

        } catch (err) {
          console.error("Deep Clean Error:", err);
          // If we failed mid-way, try to notify if possible
          try {
            if (!currentChannel.deleted) {
              await currentChannel.send("⚠️ **CRITICAL ERROR:** Deep Clean sequence encountered an obstruction. Partial wipe may have occurred.");
            }
          } catch (e) {}
        }
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time" && collected.size === 0) {
        initialReply.edit({ 
          embeds: [new EmbedBuilder()
            .setColor(0xFF0033)
            .setTitle("⏳ TIMEOUT")
            .setDescription("Authorization window closed. Protocol deactivated.")
            .setFooter({ text: "interX • Security" })
            .setTimestamp()],
          components: [] 
        }).catch(() => {});
      }
    });
  }
};
