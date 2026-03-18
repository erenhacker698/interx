const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // Check if the bot was mentioned
        if (message.mentions.has(client.user) && !message.content.includes('@everyone') && !message.content.includes('@here')) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔔 You mentioned me!')
                .setDescription(`Hey ${message.author}, you just tagged me! Here's a quick ping.`)
                .setFooter({ text: `Pinged by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await message.reply({
                embeds: [embed],
                content: `\`\`\`diff
- You tagged @${client.user.username}! 🔴 PING!
\`\`\``
            }).catch(() => { });
        }
    });

    console.log("🔔 [Auto-Responder] Mention reply system initialized.");
};