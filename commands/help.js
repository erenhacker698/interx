const {
    SlashCommandBuilder,
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

            const homeEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setAuthor({ 
                    name: `Architect: ${author.username}`, 
                    iconURL: author.displayAvatarURL({ dynamic: true }) || null 
                })
                .setThumbnail(client.user?.displayAvatarURL({ dynamic: true, size: 512 }) || null)
                .setTitle(`interX Sovereign Interface`)
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
                            "> 👤 » **Autorole**\n> 🚀 » **Fun**\n> 🎮 » **Games**\n> 🚫 » **Ignore**\n> 🌐 » **Server**\n" +
                            "> 🔊 » **Voice**\n> 🌱 » **Welcomer**\n> 🎉 » **Giveaway**\n> 🎟️ » **Ticket**\n> 👥 » **Invite**",
                        inline: true 
                    },
                    { 
                        name: "📂 EXTRA FEATURES", 
                        value: 
                            "> 📲 » **Logging**\n> ⭐ » **Vanityroles**\n> ➕ » **Counting**\n> ⚛️ » **J2C**\n> 💎 » **Boost**\n" +
                            "> 🏃 » **Leveling**\n> 📌 » **Sticky**\n> ⚡ » **Verification**\n> 🔒 » **Encryption**\n> ⛩️ » **Minecraft**\n" +
                            "> 💬 » **Joindm**\n> 🎯 » **Birthday**\n> 🚩 » **Customrole**",
                        inline: true 
                    }
                )
                .setFooter({ 
                    text: `Page 1/27 • Requested by: ${author.tag}`, 
                    iconURL: client.user?.displayAvatarURL() || null 
                })
                .setTimestamp();

            const mainSelector = new StringSelectMenuBuilder()
                .setCustomId('main_features')
                .setPlaceholder('MAIN FEATURES')
                .addOptions([
                    { label: 'Home', value: 'home', emoji: '🏠', description: 'Return to the main console' },
                    { label: 'Security Commands', value: 'antinuke', emoji: '🛡️', description: 'Show you Commands of Antinuke' },
                    { label: 'Moderation Commands', value: 'moderation', emoji: '🤖', description: 'Show you Commands of Moderation' },
                    { label: 'Utility Commands', value: 'utility', emoji: '🔧', description: 'Show you Commands of Utility' },
                    { label: 'General Commands', value: 'server', emoji: '📂', description: 'Show you Commands of General' },
                    { label: 'Automod Commands', value: 'automod', emoji: '🤖', description: 'Show you Commands of automod' },
                    { label: 'Ignore Commands', value: 'ignore', emoji: '🚫', description: 'Show you Commands of Ignore' },
                    { label: 'Server Commands', value: 'server', emoji: '🌐', description: 'Show you Commands of Server' },
                    { label: 'Voice Commands', value: 'voice', emoji: '🔊', description: 'Show you Command Of Voice' },
                    { label: 'Welcomer Commands', value: 'welcomer', emoji: '🌱', description: 'Show you Command Of Welcomer' },
                    { label: 'Giveaway Commands', value: 'giveaway', emoji: '🎉', description: 'Show you Commands of Giveaway' }
                ]);

            const extraSelector = new StringSelectMenuBuilder()
                .setCustomId('extra_features')
                .setPlaceholder('EXTRA FEATURES')
                .addOptions([
                    { label: 'Logging Commands', value: 'logging', emoji: '📲', description: 'Configure audit trail protocols' },
                    { label: 'Vanity Roles', value: 'vanity', emoji: '⭐', description: 'Manage prestige server identities' },
                    { label: 'Auto Responder', value: 'autoreact', emoji: '📡', description: 'Configure automated signal responses' },
                    { label: 'Verification System', value: 'verify', emoji: '⚡', description: 'Initialize identity scanners' }
                ]);

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('first').setEmoji('⏪').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('back').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('last').setEmoji('⏩').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );

            const row1 = new ActionRowBuilder().addComponents(mainSelector);
            const row2 = new ActionRowBuilder().addComponents(extraSelector);

            const msgData = { embeds: [homeEmbed], components: [row1, row2, buttons] };
            const response = isInteraction ? await message.reply({ ...msgData, fetchReply: true }) : await message.reply(msgData);

            const collector = response.createMessageComponentCollector({
                filter: (i) => i.user.id === author.id,
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'delete') {
                    return await i.message.delete().catch(() => {});
                }
                if (i.customId === 'main_features' || i.customId === 'extra_features') {
                    const selected = i.values[0];
                    if (selected === 'home') return await i.update({ embeds: [homeEmbed] });

                    const categoryEmbed = new EmbedBuilder()
                        .setColor("#FF0000")
                        .setTitle(`🛡️ [ ${selected.toUpperCase()} PROTOCOLS ]`)
                        .setDescription(`**Operational components for the ${selected} module.**\n\n> *Accessing database registry...*`)
                        .setFooter({ text: `interX Security • Protocol: ${selected}` });

                    await i.update({ embeds: [categoryEmbed] });
                }
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error("[Help Error]:", error);
            if (message.reply) message.reply("❌ **[ INTERX_FAILSAFE ]** Command execution failed. Logged for Architect review.").catch(() => {});
        }
    }
};