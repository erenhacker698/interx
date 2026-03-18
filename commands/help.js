const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View the command manual and bot capabilities"),

  category: "utility",

  async execute(interaction, args) {
    const isSlash = interaction.isChatInputCommand?.() || false;
    const client = interaction.client;

    // --- 1. HOME EMBED ---
    const homeEmbed = new EmbedBuilder()
      .setColor("#8B0000")
      .setAuthor({
        name: `${client.user.username} - Security System`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTitle("🔴 interX Core Control Panel")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        "Welcome to the **Sovereign Management Interface**.\n\n" +
        "> **interX** is a high-performance multipurpose bot designed for absolute server security and high-fidelity utility.\n\n" +
        "### 🛰️ SYSTEM METRICS\n" +
        `• **Total Modules:** \`${client.commands.size}\` Indexed\n` +
        "• **Latency:** `Neural link active`\n" +
        "• **Architecture:** `v3.0 Sovereign`\n\n" +
        "**Select a protocol below to view specific commands.**"
      )
      .addFields(
        { name: "🛡️ PROTECTION", value: "Anti-Nuke, Anti-Raid, White-list", inline: true },
        { name: "🎵 AUDIO", value: "High-Quality Music Processing", inline: true },
        { name: "🧰 UTILS", value: "Server Info, User Stats, Invites", inline: true }
      )
      .setFooter({ text: "Powered by interX Development • Zero-Trust Security" });

    // --- 2. CATEGORY DEFINITIONS ---
    // (Dynamically fetching commands would be better, but we need hardcoded categories for the specific layout)
    const categories = {
      antinuke: {
        label: "Antinuke Protocols",
        emoji: "🛡️",
        title: "🛡️ Defense Matrix Protocols",
        commands: [
          "`!antinuke <on|off>` — Toggle global protection",
          "`!whitelist <add|remove|list>` — Manage trusted personnel",
          "`!antiraid <on|off>` — Emergency lockdown",
          "`!spamblacklist` — Manage automated spam filters",
          "`!createbaseline` — Snapshot server state"
        ]
      },
      moderation: {
        label: "Enforcement",
        emoji: "🔨",
        title: "🔨 Moderation Enforcement",
        commands: [
          "`!ban <user>` — Permanent exclusion",
          "`!kick <user>` — Immediate ejection",
          "`!timeout <user> <time>` — Temporary restriction",
          "`!warn <user>` — Log violation warning",
          "`!purge <amount>` — Bulk data deletion",
          "`!lock` / `!unlock` — Channel transmission control"
        ]
      },
      music: {
        label: "Acoustic Module",
        emoji: "🎵",
        title: "🎵 Acoustic Neural Link",
        commands: [
          "`!play <query>` — Initialize audio stream",
          "`!stop` — Terminate player",
          "`!skip` — Cycle to next track",
          "`!volume <%>` — Adjust gain levels",
          "`!queue` — View sequence buffer",
          "`!resume` / `!pause` — Playback control"
        ]
      },
      utility: {
        label: "Utility Tools",
        emoji: "🧰",
        title: "🧰 Core Utility Systems",
        commands: [
          "`!serverinfo` — Regional analytics",
          "`!userinfo` — Subject bio-scan",
          "`!ping` — Signal resonance check",
          "`!avatar` — Optical capture",
          "`!botinfo` — System diagnostics"
        ]
      },
      backup: {
        label: "Data Vault",
        emoji: "💾",
        title: "💾 Structural Data Archiving",
        commands: [
          "`!backup create` — Seed DNA archive",
          "`!backup list` — Inspect archived seeds",
          "`!backup load-all <id>` — Full structural restoration",
          "`!backup delete <id>` — Purge archived sequence"
        ]
      }
    };

    // --- 3. COMPONENTS ---
    const menu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("📡 CHOOSE COMMAND PROTOCOL")
      .addOptions([
        { label: "Home Interface", value: "home", emoji: "🏠" },
        ...Object.keys(categories).map(key => ({
          label: categories[key].label,
          value: key,
          emoji: categories[key].emoji
        }))
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Support Hub")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/interx"),
      new ButtonBuilder()
        .setLabel("System Invite")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.com/api/oauth2/authorize?client_id=" + client.user.id + "&permissions=8&scope=bot%20applications.commands")
    );

    // --- 4. INITIAL REPLY ---
    const response = await interaction.reply({
      embeds: [homeEmbed],
      components: [row, buttons],
      fetchReply: true
    });

    // --- 5. COLLECTOR ---
    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === (isSlash ? interaction.user.id : interaction.author.id),
      time: 120000 // 2 minutes
    });

    collector.on("collect", async i => {
      if (i.customId === "help_menu") {
        const selected = i.values[0];

        if (selected === "home") {
          await i.update({ embeds: [homeEmbed] });
        } else {
          const cat = categories[selected];
          const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle(cat.title)
            .setDescription(cat.commands.join("\n"))
            .setFooter({ text: `Page: ${cat.label} • interX Help System` });

          await i.update({ embeds: [embed] });
        }
      }
    });

    collector.on("end", () => {
      if (isSlash) {
        interaction.editReply({ components: [] }).catch(() => { });
      } else {
        response.edit({ components: [] }).catch(() => { });
      }
    });
  }
};