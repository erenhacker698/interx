const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "ehelp",
    description: "God Mode Commands (Interactive Menu)",
    aliases: ["eh"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        if (!global.GOD_MODE) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **GOD MODE REQUIRED:** Execute `!eval` to toggle system override.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const clientUser = message.client.user;

        const categories = [
            {
                label: "Root Home",
                value: "home",
                emoji: "🏠",
                description: "Return to Main Menu",
                content: [
                    "🔒 GOD MODE INTELLIGENCE PANEL",
                    V2.text(
                        `**System Override Active.**\n` +
                        `Access to restricted kernel commands.\n\n` +
                        `**Select a module below:**\n` +
                        `• 🛡️ **System & Core** (Stats, Evaluation, Control)\n` +
                        `• 📡 **Broadcasting** (ANNOC, Identity, Avatar)\n` +
                        `• ⚡ **Elite Operations** (Mass Ops, Nuke, Purge)\n` +
                        `• 🔒 **Security & Locks** (God-Locks, Audit, Auth)\n` +
                        `• 👑 **Authority & Trust** (Owners, Registry, Global)\n` +
                        `• 💾 **Archival Protocols** (Backups, Restoration)\n` +
                        `• 🛰️ **Diagnostic Protocols** (Ping, Trace, Integrities)`
                    )
                ]
            },
            {
                label: "System & Core",
                value: "system",
                emoji: "🛡️",
                description: "Stats, Diagnostics, Control",
                content: [
                    "🛡️ SYSTEM & CORE MODULE",
                    "📊 [ METRICS_LOAD ]",
                    "> • **eram** / **estats** - Check resources\n> • **eusers** - Global population trace\n> • **ping** - Latency heartbeat",
                    "⚙️ [ KERNEL_CONTROL ]",
                    "> • **eval** - Direct logic execution\n> • **exec** - Shell terminal access\n> • **ediagnose** - Integrity scan\n> • **estop** / **eexit** - Process kill"
                ]
            },
            {
                label: "Broadcasting",
                value: "broadcasting",
                emoji: "📡",
                description: "Announcement & Identity",
                content: [
                    "📡 BROADCASTING MODULE",
                    "📢 [ NEURAL_COMMS ]",
                    "> • **eannoc <msg>** - Global Neural Broadcast\n> • **announce <#ch> <msg>** - Node Announcement\n> • **say <msg>** - Forced speech",
                    "👁️ [ IDENTITY_SHAPING ]",
                    "> • **setguildavatar** - Change node avatar\n> • **setguildbanner** - Change node banner\n> • **debugavatar** - Troubleshoot Identity"
                ]
            },
            {
                label: "Elite Operations",
                value: "elite",
                emoji: "⚡",
                description: "Mass Destruction & Ops",
                content: [
                    "⚡ ELITE OPERATIONS MODULE",
                    "🌊 [ MASS_DELETION ]",
                    "> • **massban <ids>** - Target deletion\n> • **massrole <r> <ids>** - Bulk assignment\n> • **purgebots** - Cleanse unauthorized entities",
                    "☢️ [ NUCLEAR_PROTOCOL ]",
                    "> • **enuke** - High-yield shard destruction\n> • **edeleteserver** - ⚠️ **NODE EXTINCTION**"
                ]
            },
            {
                label: "Security & Locks",
                value: "security",
                emoji: "🔒",
                description: "Locks, Audits, Panic",
                content: [
                    "🔒 SECURITY & LOCKS MODULE",
                    "⛓️ [ GOD_LOCKS ]",
                    "> • **elock <type>** - Lock Media/Links/Cmds\n> • **eunlock <type>** - Lift lockdown\n> • **emassch <add/remove>** - Bulk channel work",
                    "🛡️ [ DEFENSE_ANALYSIS ]",
                    "> • **audit** / **scan** - Security assessment\n> • **flagged** - Threat tracking\n> • **authsecurity** - Deploy security baselines\n> • **panic** - Immediate server shutdown"
                ]
            },
            {
                label: "Authority & Trust",
                value: "trust",
                emoji: "👑",
                description: "Management & Hierarchy",
                content: [
                    "👑 AUTHORITY & TRUST MODULE",
                    "🤝 [ TRUST_DELEGATION ]",
                    "> • **addowner** / **delowner** - Manage Acting Owners\n> • **listowners** - View local hierarchy\n> • **elistowners** - View global manifest",
                    "👁️ [ VISUAL_VERIFY ]",
                    "> • **tmpdisplay** - Security alert preview\n> • **welcome test** / **left test**"
                ]
            },
            {
                label: "Archival Protocols",
                value: "archival",
                emoji: "💾",
                description: "Backups & Restoration",
                content: [
                    "💾 ARCHIVAL PROTOCOLS MODULE",
                    "📦 [ SNAPSHOT_STORAGE ]",
                    "> • **backup create** - Structural DNA save\n> • **backup restore** - Deploy blueprint\n> • **backuplist** - Catalog snapshots",
                    "🛰️ [ ADVANCED_VECTORS ]",
                    "> • **recovery** - Trigger emergency restoration\n> • **safetybackup** - Extract core logic mapping"
                ]
            },
            {
                label: "Diagnostic Protocols",
                value: "diagnostics",
                emoji: "🛰️",
                description: "Module Integrity & Verifications",
                content: [
                    "🛰️ DIAGNOSTIC PROTOCOLS MODULE",
                    "📡 [ SYSTEM_VERIFICATION ]",
                    "> • **ping** - Core latency and status\n> • **debugavatar** - Troubleshoot and sync identity\n> • **ediagnose** - Deep Module Integrity Scan"
                ]
            }
        ];

        const createV2Panel = (pageIdx) => {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("ehelp_select")
                .setPlaceholder("💠 INITIALIZE ROOT MODULE")
                .addOptions(categories.map((cat, index) => ({
                    label: cat.label,
                    value: cat.value,
                    emoji: cat.emoji,
                    description: cat.description,
                    default: index === pageIdx
                })));

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ehelp_prev")
                    .setLabel("Back")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageIdx === 0),
                new ButtonBuilder()
                    .setCustomId("ehelp_home")
                    .setLabel("Home")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageIdx === 0),
                new ButtonBuilder()
                    .setCustomId("ehelp_stop")
                    .setLabel("Terminate")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("ehelp_next")
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageIdx === categories.length - 1)
            );

            const menuRow = new ActionRowBuilder().addComponents(selectMenu);
            const current = categories[pageIdx];

            return V2.container([
                V2.section([
                    "GOD MODE INTELLIGENCE PANEL",
                    `\`\`\`yml\nStatus: System Override Active\nSession: Architect Mode\n\`\`\``
                ], clientUser.displayAvatarURL({ forceStatic: true, extension: 'png' })),
                ...current.content,
                menuRow,
                buttons,
                "*interX • Root Access Protocol*"
            ]);
        };

        let currentIndex = 0;
        const msg = await message.reply({
            content: null,
            components: [createV2Panel(currentIndex)]
        });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 300000
        });

        collector.on("collect", async i => {
            if (i.customId === "ehelp_select") {
                currentIndex = categories.findIndex(c => c.value === i.values[0]);
            } else if (i.customId === "ehelp_prev") {
                currentIndex = Math.max(0, currentIndex - 1);
            } else if (i.customId === "ehelp_next") {
                currentIndex = Math.min(categories.length - 1, currentIndex + 1);
            } else if (i.customId === "ehelp_home") {
                currentIndex = 0;
            } else if (i.customId === "ehelp_stop") {
                await i.update({ components: [] });
                return collector.stop();
            }

            await i.update({
                components: [createV2Panel(currentIndex)]
            });
        });

        collector.on("end", (_, reason) => {
            if (reason !== "user") {
                msg.edit({ components: [] }).catch(() => { });
            }
        });
    }
};
