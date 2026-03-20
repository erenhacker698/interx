const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: "help",
    description: "interX Premium Command Interface.",
    aliases: ["h", "commands"],

    async execute(message, args) {
        try {
            const client = message.client;
            const author = message.author || message.user;
            if (!client || !author) return;

            const isInteraction = !!message.options;
            const PREFIX = "!";
            const RED = "#df0000";
            const DARK = "#2B2D31";
            const LINE = "https://media.discordapp.net/attachments/1093150036663308318/1113885934572900454/line-red.gif";

            // ───── CATEGORY DATA ─────
            const categories = {
                antinuke: {
                    emoji: "🛡️", title: "ANTINUKE PROTOCOLS",
                    desc: "Enterprise-grade server protection against nuking, mass deletion, and unauthorized modifications.",
                    cmds: ["antinuke", "antiraid", "security", "setupsecurity", "whitelist", "authwipe", "createbaseline", "rebuild", "selfProtect"]
                },
                moderation: {
                    emoji: "🔨", title: "MODERATION SUITE",
                    desc: "Complete administrative toolkit for managing members, punishments, and server order.",
                    cmds: ["ban", "kick", "mute", "unmute", "timeout", "untimeout", "warn", "warnings", "clear", "purge", "jail", "left", "slowmode", "vckick", "vmute", "vunmute", "vmuteall", "vunmuteall", "vmoveall"]
                },
                utility: {
                    emoji: "🔧", title: "UTILITY TOOLS",
                    desc: "Information retrieval, server analytics, and general-purpose commands.",
                    cmds: ["avatar", "banner", "botinfo", "devinfo", "serverinfo", "userinfo", "roleinfo", "stats", "serverstats", "invites", "ping", "suggest", "poll", "qr", "audit"]
                },
                security: {
                    emoji: "⚔️", title: "SECURITY & LOCKDOWN",
                    desc: "Channel locking, permission control, and server lockdown protocols.",
                    cmds: ["serverlock", "serverunlock", "lock", "unlock", "lockvc", "unlockvc", "hide", "show", "chperm", "roleperm", "btcdlcks", "btcmdlocks"]
                },
                autorole: {
                    emoji: "👤", title: "AUTOROLE ENGINE",
                    desc: "Automated role assignment, reaction roles, and temporary role management.",
                    cmds: ["autorole", "addrole", "removerole", "temprole", "reactionrole", "massrole", "testroles"]
                },
                server: {
                    emoji: "🌐", title: "SERVER MANAGEMENT",
                    desc: "Server structure control — channels, roles, backups, and recovery.",
                    cmds: ["createch", "deletech", "renamech", "createrole", "deleterole", "rolecopy", "setguildavatar", "setguildbanner", "setup", "backup", "restore", "panic"]
                },
                voice: {
                    emoji: "🔊", title: "VOICE CONTROL",
                    desc: "Voice channel management, defense protocols, and audio controls.",
                    cmds: ["createvc", "deletevc", "renamevc", "locksound", "unlocksound", "vdefend", "vundefend", "setupvtc", "sethomevc", "muv", "muvu"]
                },
                logging: {
                    emoji: "📲", title: "LOGGING SYSTEM",
                    desc: "Comprehensive audit trail and event logging for full server transparency.",
                    cmds: ["log", "logsetup", "elog", "ghostLogger"]
                },
                welcomer: {
                    emoji: "🌱", title: "WELCOMER",
                    desc: "Automated welcome and farewell messages with custom embed support.",
                    cmds: ["welcome"]
                },
                automod: {
                    emoji: "📡", title: "AUTO-MODERATION",
                    desc: "Automated content filtering, spam prevention, and blacklist enforcement.",
                    cmds: ["automod", "spamblacklist"]
                },
                ignore: {
                    emoji: "🚫", title: "IGNORE & BLACKLIST",
                    desc: "Manage ignored channels, roles, and blacklisted users.",
                    cmds: ["blacklist"]
                },
                ticket: {
                    emoji: "🎟️", title: "TICKET SYSTEM",
                    desc: "Customer support ticket creation and management.",
                    cmds: ["ticket"]
                },
                sticky: {
                    emoji: "📌", title: "STICKY MESSAGES",
                    desc: "Pin persistent messages that stay at the bottom of channels.",
                    cmds: ["stick"]
                },
                verification: {
                    emoji: "⚡", title: "VERIFICATION",
                    desc: "One-click member verification with role assignment.",
                    cmds: ["verify", "setupverify"]
                },
                music: {
                    emoji: "🎵", title: "MUSIC PLAYER",
                    desc: "High-fidelity music streaming with queue management.",
                    cmds: ["music", "play", "skip", "stop", "volume", "queue", "pause", "resume"]
                },
                fun: {
                    emoji: "🚀", title: "FUN & ENGAGEMENT",
                    desc: "Entertainment commands for community engagement.",
                    cmds: ["mimic", "say", "embed", "show"]
                },
                extra: {
                    emoji: "💎", title: "EXTRA FEATURES",
                    desc: "Premium integrations — vanity roles, leveling, encryption, and more.",
                    cmds: ["vanityroles", "counting", "j2c", "boost", "leveling", "encryption", "minecraft", "joindm", "birthday", "customrole"]
                }
            };

            const totalCmds = client.commands?.size || Object.values(categories).reduce((a, c) => a + c.cmds.length, 0);
            const catKeys = Object.keys(categories);

            // ───── HOME EMBED ─────
            const homeEmbed = new EmbedBuilder()
                .setColor(RED)
                .setAuthor({
                    name: "interX — Premium Security Bot",
                    iconURL: client.user.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setTitle("━━━━━━━━ COMMAND CENTER ━━━━━━━━")
                .setDescription(
                    `\`\`\`ansi\n\u001b[2;31m╔══════════════════════════════════════╗\n║     interX SOVEREIGN SYSTEM v3.0     ║\n║      Premium Security & Control      ║\n╚══════════════════════════════════════╝\u001b[0m\n\`\`\`\n` +
                    `> 🔴 **Status:** \`ONLINE\` ┃ **Latency:** \`${client.ws.ping}ms\`\n` +
                    `> 📡 **Prefix:** \`${PREFIX}\` ┃ **Commands:** \`${totalCmds}\`\n` +
                    `> 👤 **Architect:** ${author} ┃ **Servers:** \`${client.guilds.cache.size}\`\n` +
                    `\n__**Select a module from the menus below to explore commands.**__`
                )
                .addFields(
                    {
                        name: "🛡️ ┃ PROTECTION",
                        value: "> `Antinuke` `Security`\n> `Automod` `Verification`",
                        inline: true
                    },
                    {
                        name: "🔨 ┃ MANAGEMENT",
                        value: "> `Moderation` `Autorole`\n> `Server` `Voice`",
                        inline: true
                    },
                    {
                        name: "🔧 ┃ TOOLS",
                        value: "> `Utility` `Logging`\n> `Welcomer` `Ticket`",
                        inline: true
                    },
                    {
                        name: "🎵 ┃ ENTERTAINMENT",
                        value: "> `Music` `Fun`\n> `Sticky` `Ignore`",
                        inline: true
                    },
                    {
                        name: "💎 ┃ PREMIUM",
                        value: "> `Extra` `Vanity`\n> `Leveling` `Boost`",
                        inline: true
                    },
                    {
                        name: "📋 ┃ QUICK HELP",
                        value: `> \`${PREFIX}help <cmd>\` — Details\n> \`${PREFIX}h\` — This panel`,
                        inline: true
                    }
                )
                .setImage(LINE)
                .setFooter({
                    text: `interX Premium • ${message.guild?.name || "DM"} • ${catKeys.length} Modules • ${totalCmds} Commands`,
                    iconURL: message.guild?.iconURL({ dynamic: true }) || author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            // ───── SELECT MENUS ─────
            const mainSelector = new StringSelectMenuBuilder()
                .setCustomId('help_main')
                .setPlaceholder('🛡️ ┃ Protection • Management • Tools')
                .addOptions(
                    { label: 'Home', value: 'home', emoji: '🏠', description: 'Back to Command Center' },
                    { label: 'Antinuke', value: 'antinuke', emoji: '🛡️', description: `${categories.antinuke.cmds.length} commands` },
                    { label: 'Moderation', value: 'moderation', emoji: '🔨', description: `${categories.moderation.cmds.length} commands` },
                    { label: 'Utility', value: 'utility', emoji: '🔧', description: `${categories.utility.cmds.length} commands` },
                    { label: 'Security', value: 'security', emoji: '⚔️', description: `${categories.security.cmds.length} commands` },
                    { label: 'Autorole', value: 'autorole', emoji: '👤', description: `${categories.autorole.cmds.length} commands` },
                    { label: 'Server', value: 'server', emoji: '🌐', description: `${categories.server.cmds.length} commands` },
                    { label: 'Voice', value: 'voice', emoji: '🔊', description: `${categories.voice.cmds.length} commands` },
                    { label: 'Automod', value: 'automod', emoji: '📡', description: `${categories.automod.cmds.length} commands` },
                    { label: 'Welcomer', value: 'welcomer', emoji: '🌱', description: `${categories.welcomer.cmds.length} commands` },
                    { label: 'Ticket', value: 'ticket', emoji: '🎟️', description: `${categories.ticket.cmds.length} commands` }
                );

            const extraSelector = new StringSelectMenuBuilder()
                .setCustomId('help_extra')
                .setPlaceholder('💎 ┃ Entertainment • Premium • Extra')
                .addOptions(
                    { label: 'Logging', value: 'logging', emoji: '📲', description: `${categories.logging.cmds.length} commands` },
                    { label: 'Ignore', value: 'ignore', emoji: '🚫', description: `${categories.ignore.cmds.length} commands` },
                    { label: 'Music', value: 'music', emoji: '🎵', description: `${categories.music.cmds.length} commands` },
                    { label: 'Verification', value: 'verification', emoji: '⚡', description: `${categories.verification.cmds.length} commands` },
                    { label: 'Sticky', value: 'sticky', emoji: '📌', description: `${categories.sticky.cmds.length} commands` },
                    { label: 'Fun', value: 'fun', emoji: '🚀', description: `${categories.fun.cmds.length} commands` },
                    { label: 'Extra', value: 'extra', emoji: '💎', description: `${categories.extra.cmds.length} commands` }
                );

            // ───── BUTTONS ─────
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('help_delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('help_stats').setLabel('Bot Stats').setEmoji('📊').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setLabel('Support').setURL("https://discord.gg/interx").setStyle(ButtonStyle.Link),
                new ButtonBuilder().setLabel('Invite').setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`).setStyle(ButtonStyle.Link)
            );

            const row1 = new ActionRowBuilder().addComponents(mainSelector);
            const row2 = new ActionRowBuilder().addComponents(extraSelector);
            const components = [row1, row2, buttons];

            // ───── SEND ─────
            let response;
            if (isInteraction) {
                response = await message.reply({ embeds: [homeEmbed], components, fetchReply: true });
            } else {
                response = await message.reply({ embeds: [homeEmbed], components });
            }

            // ───── COLLECTOR ─────
            const collector = response.createMessageComponentCollector({
                filter: (i) => i.user.id === author.id,
                time: 180000 // 3 minutes
            });

            collector.on('collect', async (i) => {
                // ── DELETE ──
                if (i.customId === 'help_delete') {
                    collector.stop('deleted');
                    return await i.message.delete().catch(() => { });
                }

                // ── BOT STATS ──
                if (i.customId === 'help_stats') {
                    const uptime = formatUptime(client.uptime);
                    const statsEmbed = new EmbedBuilder()
                        .setColor(RED)
                        .setAuthor({
                            name: "interX — System Diagnostics",
                            iconURL: client.user.displayAvatarURL({ dynamic: true })
                        })
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                        .setTitle("━━━━━━━━ SYSTEM STATUS ━━━━━━━━")
                        .addFields(
                            { name: "⏱️ ┃ Uptime", value: `> \`${uptime}\``, inline: true },
                            { name: "📡 ┃ Ping", value: `> \`${client.ws.ping}ms\``, inline: true },
                            { name: "🌐 ┃ Servers", value: `> \`${client.guilds.cache.size}\``, inline: true },
                            { name: "👥 ┃ Users", value: `> \`${client.users.cache.size}\``, inline: true },
                            { name: "💬 ┃ Channels", value: `> \`${client.channels.cache.size}\``, inline: true },
                            { name: "📦 ┃ Commands", value: `> \`${totalCmds}\``, inline: true }
                        )
                        .setImage(LINE)
                        .setFooter({ text: "interX Premium • Click Home to return" })
                        .setTimestamp();

                    return await i.update({ embeds: [statsEmbed], components });
                }

                // ── MENU SELECTION ──
                const selected = i.values?.[0];
                if (!selected) return;

                if (selected === 'home') {
                    return await i.update({ embeds: [homeEmbed], components });
                }

                const cat = categories[selected];
                if (!cat) return await i.update({ embeds: [homeEmbed], components });

                // Build command list in two columns
                const cmdList = cat.cmds;
                const mid = Math.ceil(cmdList.length / 2);
                const col1 = cmdList.slice(0, mid).map((c, idx) => `\`${String(idx + 1).padStart(2, '0')}.\` **${c}**`).join("\n");
                const col2 = cmdList.slice(mid).map((c, idx) => `\`${String(idx + mid + 1).padStart(2, '0')}.\` **${c}**`).join("\n");

                const catEmbed = new EmbedBuilder()
                    .setColor(RED)
                    .setAuthor({
                        name: `interX — ${cat.title}`,
                        iconURL: client.user.displayAvatarURL({ dynamic: true })
                    })
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setTitle(`━━━━━━ ${cat.emoji} ${cat.title} ━━━━━━`)
                    .setDescription(
                        `> ${cat.desc}\n\n` +
                        `\`\`\`ansi\n\u001b[2;31m[ ${cmdList.length} Commands Available ]\u001b[0m\n\`\`\``
                    )
                    .addFields(
                        { name: "Commands", value: col1 || "—", inline: true },
                        { name: "\u200b", value: col2 || "\u200b", inline: true },
                        {
                            name: "━━━━━━━━━━━━━━━━━━━━━━━━",
                            value: `> 📋 \`${PREFIX}help <command>\` — Detailed usage\n> 🏠 Select **Home** to return`,
                            inline: false
                        }
                    )
                    .setImage(LINE)
                    .setFooter({
                        text: `interX Premium • ${cat.title} • ${cmdList.length} Commands`,
                        iconURL: message.guild?.iconURL({ dynamic: true }) || author.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp();

                await i.update({ embeds: [catEmbed], components });
            });

            collector.on('end', (_, reason) => {
                if (reason === 'deleted') return;
                const disabledRow1 = ActionRowBuilder.from(row1);
                const disabledRow2 = ActionRowBuilder.from(row2);
                disabledRow1.components.forEach(c => c.setDisabled(true));
                disabledRow2.components.forEach(c => c.setDisabled(true));
                const disabledBtns = ActionRowBuilder.from(buttons);
                disabledBtns.components.forEach(c => { if (c.data.style !== ButtonStyle.Link) c.setDisabled(true); });

                response.edit({ components: [disabledRow1, disabledRow2, disabledBtns] }).catch(() => { });
            });

        } catch (error) {
            console.error("[Help Error]:", error);
        }
    }
};

// ───── UPTIME FORMATTER ─────
function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${sec}s`);
    return parts.join(" ");
}