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
                    { label: 'Security', value: 'antinuke', emoji: '🛡️', description: 'Antinuke protocols' },
                    { label: 'Moderation', value: 'moderation', emoji: '🤖', description: 'Mod protocols' },
                    { label: 'Utility', value: 'utility', emoji: '🔧', description: 'Utility tools' },
                    { label: 'General', value: 'server_general', emoji: '📂', description: 'General commands' },
                    { label: 'Automod', value: 'automod', emoji: '🤖', description: 'Auto-security' },
                    { label: 'Ignore', value: 'ignore', emoji: '🚫', description: 'Ignore list' },
                    { label: 'Voice', value: 'voice', emoji: '🔊', description: 'Voice controls' },
                    { label: 'Welcomer', value: 'welcomer', emoji: '🌱', description: 'User greetings' },
                    { label: 'Giveaway', value: 'giveaway', emoji: '🎉', description: 'Prize management' }
                );

            const extraSelector = new StringSelectMenuBuilder()
                .setCustomId('extra_features')
                .setPlaceholder('EXTRA FEATURES')
                .addOptions(
                    { label: 'Logging', value: 'logging', emoji: '📲', description: 'Log system' },
                    { label: 'Vanity Roles', value: 'vanity', emoji: '⭐', description: 'Prestige roles' },
                    { label: 'Autoreact', value: 'autoreact', emoji: '📡', description: 'Signal responses' },
                    { label: 'Verification', value: 'verify', emoji: '⚡', description: 'Identity scan' }
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
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'delete') {
                    return await i.message.delete().catch(() => {});
                }
                
                const selected = i.values[0];
                if (selected === 'home') {
                    return await i.update({ embeds: [homeEmbed] });
                }

                const categoryEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle(`🛡️ [ ${selected.toUpperCase()} PROTOCOLS ]`)
                    .setDescription(`**Operational components for the ${i.customId.replace("_", " ")} module.**\n\nSelected Scope: \`${selected}\`\n\n> *Accessing database registry...*`)
                    .setFooter({ text: `interX Security • Protocol: ${selected}` });

                await i.update({ embeds: [categoryEmbed] });
            });

            collector.on('end', () => {
                response.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error("[Help Error]:", error);
            if (message.reply) message.reply("❌ **INTERX_FAILSAFE_TRIGGERED**").catch(() => {});
        }
    }
};