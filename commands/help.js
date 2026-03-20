const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: "help",
    description: "Display the interX command interface.",
    aliases: ["h", "commands"],

    async execute(message, args) {
        try {
            const client = message.client;
            const author = message.author || message.user;
            if (!client || !author) return;

            const isInteraction = !!message.options;
            const PREFIX = "!";

            // ───── CATEGORY DATA ─────
            const categories = {
                antinuke: { emoji: "🛡️", cmds: ["antinuke", "antiraid", "security", "setupsecurity", "whitelist", "authwipe", "createbaseline", "rebuild", "selfProtect"] },
                moderation: { emoji: "🔨", cmds: ["ban", "kick", "mute", "unmute", "timeout", "untimeout", "warn", "warnings", "clear", "purge", "jail", "left", "slowmode", "vckick", "vmute", "vunmute", "vmuteall", "vunmuteall", "vmoveall"] },
                utility: { emoji: "🔧", cmds: ["avatar", "banner", "botinfo", "devinfo", "serverinfo", "userinfo", "roleinfo", "stats", "serverstats", "invites", "ping", "suggest", "poll", "qr", "audit"] },
                security: { emoji: "⚔️", cmds: ["serverlock", "serverunlock", "lock", "unlock", "lockvc", "unlockvc", "hide", "show", "chperm", "roleperm", "btcdlcks", "btcmdlocks"] },
                autorole: { emoji: "👤", cmds: ["autorole", "addrole", "removerole", "temprole", "reactionrole", "massrole", "testroles"] },
                server: { emoji: "🌐", cmds: ["createch", "deletech", "renamech", "createrole", "deleterole", "rolecopy", "setguildavatar", "setguildbanner", "setup", "backup", "restore", "panic"] },
                voice: { emoji: "🔊", cmds: ["createvc", "deletevc", "renamevc", "locksound", "unlocksound", "vdefend", "vundefend", "setupvtc", "sethomevc", "muv", "muvu"] },
                logging: { emoji: "📲", cmds: ["log", "logsetup", "elog", "ghostLogger"] },
                welcomer: { emoji: "🌱", cmds: ["welcome"] },
                automod: { emoji: "📡", cmds: ["automod", "spamblacklist"] },
                ignore: { emoji: "🚫", cmds: ["blacklist"] },
                ticket: { emoji: "🎟️", cmds: ["ticket"] },
                sticky: { emoji: "📌", cmds: ["stick"] },
                verification: { emoji: "⚡", cmds: ["setupverify"] },
                music: { emoji: "🎵", cmds: ["music", "play", "skip", "stop", "volume", "queue", "pause", "resume"] },
                fun: { emoji: "🚀", cmds: ["mimic", "say", "embed", "show"] },
                extra: { emoji: "💎", cmds: ["vanityroles", "counting", "j2c", "boost", "leveling", "encryption", "minecraft", "joindm", "birthday", "customrole"] }
            };

            // ───── HOME EMBED ─────
            const homeEmbed = new EmbedBuilder()
                .setColor("#df0000")
                .setAuthor({
                    name: `${client.user.username} • Help Panel`,
                    iconURL: client.user.displayAvatarURL({ dynamic: true })
                })
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setDescription(
                    `> **Prefix:** \`${PREFIX}\` ┃ **Commands:** \`${client.commands?.size || "..."}\` ┃ **User:** ${author}`
                )
                .addFields(
                    {
                        name: "🛡️ Core",
                        value: "`Antinuke` `Moderation` `Utility` `Security` `Autorole` `Server` `Voice` `Automod` `Welcomer` `Ticket`",
                        inline: false
                    },
                    {
                        name: "💎 Extra",
                        value: "`Logging` `Music` `Sticky` `Verify` `Fun` `Ignore` `Vanity` `Boost` `Encryption` `J2C`",
                        inline: false
                    },
                    {
                        name: "\u200b",
                        value: `Use \`${PREFIX}help <command>\` for details • Select a module below ↓`,
                        inline: false
                    }
                )
                .setFooter({
                    text: `interX Security • ${message.guild?.name || "DM"}`,
                    iconURL: author.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            // ───── SELECT MENUS ─────
            const mainSelector = new StringSelectMenuBuilder()
                .setCustomId('help_main')
                .setPlaceholder('🛡️ Select a Core Module')
                .addOptions(
                    { label: '🏠 Home', value: 'home', description: 'Return to the main panel' },
                    { label: '🛡️ Antinuke', value: 'antinuke', description: 'Anti-nuke security protocols' },
                    { label: '🔨 Moderation', value: 'moderation', description: 'Admin & moderation tools' },
                    { label: '🔧 Utility', value: 'utility', description: 'Info & utility commands' },
                    { label: '⚔️ Security', value: 'security', description: 'Lock & permission management' },
                    { label: '👤 Autorole', value: 'autorole', description: 'Auto role assignment' },
                    { label: '🌐 Server', value: 'server', description: 'Server management tools' },
                    { label: '🔊 Voice', value: 'voice', description: 'Voice channel controls' },
                    { label: '📡 Automod', value: 'automod', description: 'Auto-moderation system' },
                    { label: '🌱 Welcomer', value: 'welcomer', description: 'Welcome message setup' },
                    { label: '🎟️ Ticket', value: 'ticket', description: 'Ticket support system' }
                );

            const extraSelector = new StringSelectMenuBuilder()
                .setCustomId('help_extra')
                .setPlaceholder('💎 Select an Extra Module')
                .addOptions(
                    { label: '📲 Logging', value: 'logging', description: 'Server audit logs' },
                    { label: '🚫 Ignore', value: 'ignore', description: 'Blacklist management' },
                    { label: '🎵 Music', value: 'music', description: 'Music player commands' },
                    { label: '⚡ Verification', value: 'verification', description: 'Member verification' },
                    { label: '📌 Sticky', value: 'sticky', description: 'Sticky messages' },
                    { label: '🚀 Fun', value: 'fun', description: 'Fun & engagement commands' },
                    { label: '💎 Extra', value: 'extra', description: 'Extra features & integrations' }
                );

            // ───── BUTTONS ─────
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('help_delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
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
                time: 120000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'help_delete') {
                    return await i.message.delete().catch(() => {});
                }

                const selected = i.values?.[0];
                if (!selected) return;

                if (selected === 'home') {
                    return await i.update({ embeds: [homeEmbed], components });
                }

                const cat = categories[selected];
                if (!cat) return await i.update({ embeds: [homeEmbed], components });

                const cmdList = cat.cmds;
                const formatted = cmdList.map(c => `\`${c}\``).join("  ") || "No commands found.";

                const catEmbed = new EmbedBuilder()
                    .setColor("#df0000")
                    .setAuthor({
                        name: `${client.user.username} • ${selected.charAt(0).toUpperCase() + selected.slice(1)}`,
                        iconURL: client.user.displayAvatarURL({ dynamic: true })
                    })
                    .addFields(
                        {
                            name: `${cat.emoji} ${selected.toUpperCase()} — ${cmdList.length} commands`,
                            value: formatted,
                            inline: false
                        }
                    )
                    .setDescription(`> Use \`${PREFIX}help <command>\` for details`)
                    .setImage("https://media.discordapp.net/attachments/1093150036663308318/1113885934572900454/line-red.gif")
                    .setFooter({
                        text: `interX Security • ${selected.charAt(0).toUpperCase() + selected.slice(1)} Module • ${cmdList.length} commands`,
                        iconURL: author.displayAvatarURL({ dynamic: true })
                    })
                    .setTimestamp();

                await i.update({ embeds: [catEmbed], components });
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error("[Help Error]:", error);
        }
    }
};