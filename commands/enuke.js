const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
  name: "enuke",
  description: "Elite Extreme Nuke (Protocol 0). Multi-stage verified destruction.",
  async execute(message, args) {
    // 0. Permission Check
    if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **Access Denied:** Unauthorized use of Protocol 0. Restricted to the Lead Architect.").setFooter({ text: "interX • Security" }).setTimestamp()] });
    }

    // STAGE 1: INITIAL AUTHORIZATION
    const authContainer = V2.container([
      V2.section([
        "☣️ AUTHORIZATION: PROTOCOL 0",
        V2.text(
          "You are initiating a **FULL SERVER SANITIZATION**.\n" +
          "This action will **PERMANENTLY ANNIHILATE** all channels, roles, and entities.\n\n" +
          "**Do you wish to authorize the wipe?**"
        )
      ], "https://cdn-icons-png.flaticon.com/512/564/564619.png"),
      "*interX • Annihilation Security Gate*"
    ]);

    const authRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("enuke_auth_proceed").setLabel("☣️ Confirm Annihilation").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("enuke_auth_cancel").setLabel("✖️ Abort Sequence").setStyle(ButtonStyle.Secondary)
    );

    const initialMsg = await message.channel.send({
      content: "## ☣️ AUTHORIZATION: PROTOCOL 0\n> You are initiating a **FULL SERVER SANITIZATION**.\n> This will **PERMANENTLY DESTROY** all channels, roles, and entities.\n\n**Do you wish to authorize the wipe?**",
      components: [authRow]
    });

    const authCollector = initialMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 30000,
      max: 1
    });

    authCollector.on("collect", async i => {
      if (i.customId === "enuke_auth_cancel") {
        return i.update({
          content: "❌ **Protocol Aborted.** Standing down.",
          components: []
        });
      }

      // STAGE 2: STRATEGY SELECTION
      const strategyRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("enuke_strat_rebuild").setLabel("🔁 Purge + Rebuild").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("enuke_strat_only").setLabel("💀 Purge Only").setStyle(ButtonStyle.Danger)
      );

      const stratMsg = await i.update({
        content: "## 🛠️ RECONSTRUCTION STRATEGY\n> Phase 1 verified. Choose your post-annihilation protocol:\n\n**Option A — Purge + Rebuild:** Destroy everything and deploy custom channels.\n**Option B — Purge Only:** Destroy everything and leave the node empty.",
        components: [strategyRow],
        fetchReply: true
      });

      const stratCollector = stratMsg.createMessageComponentCollector({
        filter: (i2) => i2.user.id === message.author.id,
        time: 30000,
        max: 1
      });

      stratCollector.on("collect", async i2 => {
        const strategy = i2.customId;

        if (strategy === "enuke_strat_only") {
          await runEnuke(i2, false);
        } else {
          // STAGE 3: MODAL FOR PARAMETERS
          const modal = new ModalBuilder()
            .setCustomId("enuke_rebuild_modal")
            .setTitle("Reconstruction Parameters");

          const nameInput = new TextInputBuilder()
            .setCustomId("rebuild_name")
            .setLabel("Channel Name")
            .setPlaceholder("general")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const countInput = new TextInputBuilder()
            .setCustomId("rebuild_count")
            .setLabel("Channel Count (1-50)")
            .setPlaceholder("10")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(countInput));

          await i2.showModal(modal);

          try {
            const submitted = await i2.awaitModalSubmit({ time: 60000, filter: mi => mi.user.id === i2.user.id });

            const chanName = submitted.fields.getTextInputValue("rebuild_name");
            const chanCount = parseInt(submitted.fields.getTextInputValue("rebuild_count"));

            if (isNaN(chanCount) || chanCount < 1 || chanCount > 100) {
              return submitted.reply({ content: "❌ **Invalid Count:** Range 1-100.", ephemeral: true });
            }

            await runEnuke(submitted, true, { name: chanName, count: chanCount });
          } catch (e) { }
        }
      });
    });

    async function runEnuke(interaction, rebuild, params = {}) {
      const statusContent = "## ☣️ PROTOCOL 0: ACTIVATED\n```diff\n- INITIALIZING FULL SERVER SANITIZATION\n- TARGETING: CHANNELS, ROLES, EMOJIS, WEBHOOKS\n```\n*interX • Annihilation Sequence in Progress*";

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: statusContent, components: [] });
      } else {
        await interaction.update({ content: statusContent, components: [] });
      }

      const guild = message.guild;

      try {
        const channels = guild.channels.cache;
        const roles = guild.roles.cache.filter(r => r.editable && r.id !== guild.id);
        const emojis = guild.emojis.cache;

        const tasks = [];
        tasks.push(Promise.all(roles.map(r => r.delete().catch(() => { }))));
        tasks.push(Promise.all(channels.map(c => c.delete().catch(() => { }))));
        tasks.push(Promise.all(emojis.map(e => e.delete().catch(() => { }))));

        let rebuildResults = [];
        if (rebuild) {
          const rebuildPromises = [];
          for (let i = 0; i < params.count; i++) {
            rebuildPromises.push(
              guild.channels.create({
                name: params.name,
                type: ChannelType.GuildText,
                reason: "Protocol 0: Rebuild"
              }).catch(() => { })
            );
          }
          tasks.push(Promise.all(rebuildPromises).then(res => { rebuildResults = res; }));
        }

        message.client.nukingGuilds.add(guild.id);
        try {
          await Promise.all(tasks);
        } finally {
          message.client.nukingGuilds.delete(guild.id);
        }

        if (rebuild) {
          const firstChannel = rebuildResults.find(c => c);
          if (firstChannel) {
            const successContainer = V2.container([
              V2.section([
                "✅ ANNIHILATION COMPLETE",
                `The node has been sanitized and reconstructed by <@${message.author.id}>.`
              ], "https://cdn-icons-png.flaticon.com/512/190/190411.png")
            ]);
            firstChannel.send({ content: null, components: [successContainer] }).catch(() => { });
          }
        }
      } catch (err) {
        console.error("Enuke Error:", err);
      }
    }
  } };
