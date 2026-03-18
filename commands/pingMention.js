const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pingmention')
        .setDescription('Sends a red ping embed like when someone mentions the bot'),

    async slashExecute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔔 You mentioned me!')
            .setDescription(`Hey ${interaction.user}, this simulates a ping mention!`)
            .setFooter({ text: `Pinged by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            content:
                `\`\`\`diff
- You tagged @${interaction.client.user.username}! 🔴 PING!
\`\`\``
        });
    },
};
