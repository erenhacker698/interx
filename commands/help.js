const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const V2 = require("../utils/v2Utils");

module.exports = {
    name: "help",
    description: "Construct the interX Sovereign Control Panel.",
    aliases: ["h", "commands"],

    async execute(message, args) {
        try {
            const client = message.client;
            const author = message.author || message.user;
            if (!client || !author) return;

            const isInteraction = !!message.options;
            const PREFIX = "!"; 
            const THEME_RED = "#df0000";

            // ───── CATEGORY MAPPING ─────
            const categories = {
                antinuke: ["antinuke", "antiraid", "security", "setupsecurity", "whitelist", "authwipe", "createbaseline", "rebuild", "selfProtect"],
                moderation: ["ban", "kick", "mute", "unmute", "timeout", "untimeout", "warn", "warnings", "clear", "purge", "jail", "left", "slowmode", "vckick", "vmute", "vunmute", "vmuteall", "vunmuteall", "vmoveall"],
                utility: ["avatar", "banner", "botinfo", "devinfo", "serverinfo", "userinfo", "roleinfo", "stats", "serverstats", "invites", "ping", "suggest", "poll", "qr", "audit"],
                security: ["serverlock", "serverunlock", "lock", "unlock", "lockvc", "unlockvc", "hide", "show", "chperm", "roleperm", "btcdlcks", "btcmdlocks"],
                autorole: ["autorole", "addrole", "removerole", "temprole", "reactionrole", "massrole", "testroles"],
                server: ["createch", "deletech", "renamech", "createrole", "deleterole", "rolecopy", "setguildavatar", "setguildbanner", "setup", "backup", "restore", "panic"],
                voice: ["createvc", "deletevc", "renamevc", "locksound", "unlocksound", "vdefend", "vundefend", "setupvtc", "sethomevc", "muv", "muvu"],
                logging: ["log", "logsetup", "elog", "ghostLogger"],
                welcomer: ["welcome"],
                automod: ["automod", "spamblacklist"],
                ignore: ["blacklist"],
                ticket: ["ticket"],
                sticky: ["stick"],
                verification: ["setupverify"],
                music: ["music", "play", "skip", "stop", "volume", "queue", "pause", "resume"],
                fun: ["mimic", "say", "embed", "show"],
                extra: ["vanityroles", "counting", "j2c", "boost", "leveling", "encryption", "minecraft", "joindm", "birthday", "customrole"]
            };

            const homeEmbed = V2.container([
                V2.section([
                    V2.heading("SOVEREIGN CONTROL PANEL", 1),
                    V2.text(
                        `### **SYSTEM_STATUS: 🟢 ACTIVE**\n` +
                        `> **Architect:** ${author.username}\n` +
                        `> **Registry:** \`${client.commands?.size || "..."}\` commands available\n\n` +
                        `**Initialize your node by selecting a sector below. interX provides premium security and versatility protocols.**`
                    )
                ], client.user?.displayAvatarURL({ dynamic: true, size: 512 })),
                V2.separator(),
                V2.section([
                    V2.heading("PRIMARY INFRASTRUCTURE", 2),
                    V2.text(
                        "> 🛡️ » **Antinuke**\n> 🤖 » **Moderation**\n> 🔧 » **Utility**\n> 📡 » **Autoreact**\n> ⚔️ » **Security**\n" +
                        "> 👤 » **Autorole**\n> 🌐 » **Server**\n> 🔊 » **Voice**\n> 🌱 » **Welcomer**"
                    )
                ]),
                V2.section([
                    V2.heading("AUXILIARY MODULES", 3),
                    V2.text(
                        "> 📲 » **Logging**\n> ⭐ » **Vanity**\n> ⚛️ » **J2C**\n" +
                        "> 💎 » **Boost**\n> 🏃 » **Leveling**\n> 📌 » **Sticky**\n" +
                        "> ⚡ » **Verify**\n> 🔒 » **Encryption**\n> 🎟️ » **Ticket**"
                    )
                ]),
                `*interX Sovereign System • Ultimate UI Protocol*`
            ], THEME_RED);

            const mainSelector = new StringSelectMenuBuilder()
                .setCustomId('main_features')
                .setPlaceholder('💠 INITIALIZE MAIN SECTORS')
                .addOptions(
                    { label: 'Return Home', value: 'home', emoji: '🏠', description: 'Access main control center' },
                    { label: 'Antinuke', value: 'antinuke', emoji: '🛡️', description: 'Antinuke security protocols' },
                    { label: 'Moderation', value: 'moderation', emoji: '🤖', description: 'Administrative management tools' },
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
                .setPlaceholder('🚀 INITIALIZE AUXILIARY SECTORS')
                .addOptions(
                    { label: 'Logging', value: 'logging', emoji: '📲', description: 'Audit trail management' },
                    { label: 'Ignore', value: 'ignore', emoji: '🚫', description: 'Blacklist management' },
                    { label: 'Music', value: 'music', emoji: '🎵', description: 'High-fidelity audio stream' },
                    { label: 'Verification', value: 'verification', emoji: '⚡', description: 'Identity scan protocols' },
                    { label: 'Sticky', value: 'sticky', emoji: '📌', description: 'Pinned message automation' },
                    { label: 'Fun', value: 'fun', emoji: '🚀', description: 'User engagement scripts' }
                );

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setLabel('Support').setURL("https://discord.gg/interx").setStyle(ButtonStyle.Link),
                new ButtonBuilder().setLabel('Invite').setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`).setStyle(ButtonStyle.Link)
            );

            const row1 = new ActionRowBuilder().addComponents(mainSelector);
            const row2 = new ActionRowBuilder().addComponents(extraSelector);

            const components = [row1, row2, buttons];
            let response;
            
            if (isInteraction) {
                response = await message.reply({ components: [homeEmbed, ...components], fetchReply: true });
            } else {
                response = await message.reply({ components: [homeEmbed, ...components] });
            }

            const collector = response.createMessageComponentCollector({
                filter: (i) => i.user.id === author.id,
                time: 120000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'delete') {
                    return await i.message.delete().catch(() => {});
                }
                
                const selected = i.values[0];
                if (selected === 'home') {
                    return await i.update({ components: [homeEmbed, ...components] });
                }

                const cmdList = categories[selected] || [];
                const formattedCmds = cmdList.map(c => `\`${c}\``).join(", ") || "No modules detected in this sector.";

                const categoryEmbed = V2.container([
                    V2.section([
                        V2.heading(`${selected} Protocols`, 1),
                        V2.text(`### **Operational components for the ${selected} infrastructure are listed below.**\n\n${formattedCmds}\n\n> *Use \`${PREFIX}help <command>\` for deep-scan details.*`)
                    ]),
                    `*interX Security • Command Count: ${cmdList.length}*`
                ], THEME_RED);

                await i.update({ components: [categoryEmbed, ...components] });
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error("[Help Error]:", error);
        }
    }
};