const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: "help",
    description: "Construct the interX help interface.",
    aliases: ["h", "commands"],

    async execute(message, args) {
        try {
            const client = message.client;
            const author = message.author || message.user;
            if (!client || !author) return;

            const isInteraction = !!message.options;
            const PREFIX = "!"; 

            // ───── CATEGORY MAPPING ─────
            const categories = {
                antinuke: ["antinuke", "antiraid", "security", "setupsecurity", "whitelist", "authwipe", "createbaseline", "rebuild", "selfProtect"],
                moderation: ["ban", "kick", "mute", "unmute", "timeout", "untimeout", "warn", "warnings", "clear", "purge", "jail", "left", "slowmode", "vckick", "vmute", "vunmute", "vmuteall", "vunmuteall", "vmoveall"],
                utility: ["avatar", "banner", "botinfo", "devinfo", "serverinfo", "userinfo", "roleinfo", "stats", "serverstats", "invites", "invite-lb", "invitelogger", "ping", "suggest", "poll", "qr", "audit"],
                security: ["serverlock", "serverunlock", "lock", "unlock", "lockvc", "unlockvc", "hide", "show", "chperm", "roleperm", "btcdlcks", "btcmdlocks", "threatscan"],
                autorole: ["autorole", "addrole", "removerole", "temprole", "reactionrole", "massrole", "testroles"],
                server: ["createch", "deletech", "renamech", "createrole", "deleterole", "rolecopy", "setguildavatar", "setguildbanner", "setup", "backup", "restore", "panic", "deepclean"],
                voice: ["createvc", "deletevc", "renamevc", "locksound", "unlocksound", "vdefend", "vundefend", "setupvtc", "sethomevc", "muv", "muvu"],
                logging: ["log", "logsetup", "elog", "ghostLogger"],
                welcomer: ["welcome"],
                automod: ["automod", "spamblacklist"],
                ignore: ["blacklist"],
                ticket: ["ticket"],
                sticky: ["stick"],
                verification: ["verify", "setupverify"],
                music: ["music", "play", "skip", "stop", "volume", "queue", "pause", "resume"],
                fun: ["mimic", "say", "embed", "show"],
                extra: ["vanityroles", "counting", "j2c", "boost", "leveling", "encryption", "minecraft", "joindm", "birthday", "customrole"]
            };

            const homeEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setAuthor({ 
                    name: `Architect: ${author.username}`, 
                    iconURL: author.displayAvatarURL({ dynamic: true }) || undefined 
                })
                .setThumbnail(client.user?.displayAvatarURL({ dynamic: true, size: 512 }) || undefined)
                .setTitle(`interX Sovereign System`)
                .setDescription(
                    `**Elevate Your Discord Experience With interX Best Quality\nSecurity & Versatility !**\n\n` +
                    `**Prefix:** \`${PREFIX}\`\n` +
                    `**Total Commands:** \`${client.commands?.size || "..."}\`\n\n` +
                    `**Use \`${PREFIX}help <command>\` for details**\n\n` +
                    `**Choose A Specific Module Of Your Own Desire !**`
                )
                .addFields(
                    { 
                        name: "☁️ MAIN FEATURES", 
                        value: 
                            "> 🛡️ » **Antinuke**\n> 🤖 » **Moderation**\n> 🔧 » **Utility**\n> 📡 » **Autoreact**\n> ⚔️ » **Security**\n" +
                            "> 👤 » **Autorole**\n> 🚀 » **Fun**\n> 🎮 » **Games**\n> 🚫 » **Ignore**\n" +
                            "> 🌐 » **Server**\n> 🔊 » **Voice**\n> 🌱 » **Welcomer**\n> 🎉 » **Giveaway**\n" +
                            "> 🎟️ » **Ticket**\n> 👥 » **Invite**",
                        inline: true 
                    },
                    { 
                        name: "📂 EXTRA FEATURES", 
                        value: 
                            "> 📲 » **Logging**\n> ⭐ » **Vanityroles**\n> ➕ » **Counting**\n> ⚛️ » **J2C**\n" +
                            "> 💎 » **Boost**\n> 🏃 » **Leveling**\n> 📌 » **Sticky**\n> ⚡ » **Verification**\n" +
                            "> 🔒 » **Encryption**\n> ⛩️ » **Minecraft**\n> 💬 » **Joindm**\n> 🎯 » **Birthday**\n" +
                            "> 🚩 » **Customrole**",
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Page 1/27 • Requested by: ${author.tag}`, 
                    iconURL: client.user?.displayAvatarURL() || undefined 
                })
                .setTimestamp();

            const mainSelector = new StringSelectMenuBuilder()
                .setCustomId('main_features')
                .setPlaceholder('MAIN FEATURES')
                .addOptions(
                    { label: 'Home', value: 'home', emoji: '🏠', description: 'Return to console' },
                    { label: 'Antinuke', value: 'antinuke', emoji: '🛡️', description: 'Antinuke security protocols' },
                    { label: 'Moderation', value: 'moderation', emoji: '🤖', description: 'Admin management tools' },
                    { label: 'Utility', value: 'utility', emoji: '🔧', description: 'System information & tools' },
                    { label: 'Security', value: 'security', emoji: '⚔️', description: 'Channel & server locking' },
                    { label: 'Autorole', value: 'autorole', emoji: '👤', description: 'Role assignment automation' },
                    { label: 'Server', value: 'server', emoji: '🌐', description: 'Server structure management' },
                    { label: 'Voice', value: 'voice', emoji: '🔊', description: 'Voice channel protocols' },
                    { label: 'Automod', value: 'automod', emoji: '📡', description: 'Automated signal responses' },
                    { label: 'Welcomer', value: 'welcomer', emoji: '🌱', description: 'Greeting configurations' },
                    { label: 'Ticket', value: 'ticket', emoji: '🎟️', description: 'Customer support nodes' }
                );

            const extraSelector = new StringSelectMenuBuilder()
                .setCustomId('extra_features')
                .setPlaceholder('EXTRA FEATURES')
                .addOptions(
                    { label: 'Logging', value: 'logging', emoji: '📲', description: 'Audit trail management' },
                    { label: 'Ignore', value: 'ignore', emoji: '🚫', description: 'Blacklist management' },
                    { label: 'Music', value: 'music', emoji: '🎵', description: 'High-fidelity audio stream' },
                    { label: 'Verification', value: 'verification', emoji: '⚡', description: 'Identity scan protocols' },
                    { label: 'Sticky', value: 'sticky', emoji: '📌', description: 'Pinned message automation' },
                    { label: 'Fun', value: 'fun', emoji: '🚀', description: 'User engagement scripts' },
                    { label: 'Extra', value: 'extra', emoji: '💎', description: 'Premium features' }
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('first').setEmoji('⏪').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('back').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('last').setEmoji('⏩').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );

            const row1 = new ActionRowBuilder().addComponents(mainSelector);
            const row2 = new ActionRowBuilder().addComponents(extraSelector);

            const components = [row1, row2, buttons];
            let response;
            
            if (isInteraction) {
                response = await message.reply({ embeds: [homeEmbed], components: components, fetchReply: true });
            } else {
                response = await message.reply({ embeds: [homeEmbed], components: components });
            }

            const collector = response.createMessageComponentCollector({
                filter: (i) => i.user.id === author.id,
                time: 120000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'delete') {
                    return await i.message.delete().catch(() => {});
                }
                
                const selected = i.values?.[0];
                if (!selected) return;

                if (selected === 'home') {
                    return await i.update({ embeds: [homeEmbed] });
                }

                const cmdList = categories[selected] || [];
                const formattedCmds = cmdList.map(c => `\`${c}\``).join(", ") || "No modules detected in this node.";

                const categoryEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle(`🛡️ [ ${selected.toUpperCase()} PROTOCOLS ]`)
                    .setDescription(`**Operational components for the ${selected} infrastructure are listed below.**\n\n${formattedCmds}\n\n> *Use \`${PREFIX}help <command>\` for deep-scan details.*`)
                    .setFooter({ text: `interX Security • Protocol: ${selected} | Commands: ${cmdList.length}` });

                await i.update({ embeds: [categoryEmbed] });
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error("[Help Error]:", error);
        }
    }
};