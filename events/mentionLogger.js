const { EmbedBuilder } = require('discord.js');
const { BOT_OWNER_ID, EMBED_COLOR } = require('../config');

module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        // Skip BOT's own messages, other bots, and DM messages
        if (!message.guild || message.author.bot) return;

        // Check if the bot owner was mentioned in the message
        // This includes direct mentions and roles mentions if the owner has the role
        const mentionsOwner = message.mentions.users.has(BOT_OWNER_ID) || 
                             message.content.includes(`<@${BOT_OWNER_ID}>`) || 
                             message.content.includes(`<@!${BOT_OWNER_ID}>`);

        // Check if the owner has a role that was mentioned
        const ownerMember = message.guild.members.cache.get(BOT_OWNER_ID);
        const roleMentioned = message.mentions.roles.some(role => ownerMember?.roles.cache.has(role.id));

        if ((mentionsOwner || roleMentioned) && message.author.id !== BOT_OWNER_ID) {
            try {
                const owner = await client.users.fetch(BOT_OWNER_ID).catch(() => null);
                if (!owner) return;

                const timeStr = new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit', 
                    hour12: true 
                });

                const embed = new EmbedBuilder()
                    .setColor(EMBED_COLOR || "#df0000") // Red theme matching the user's bot
                    .setAuthor({ 
                        name: `Time: ${timeStr}\nTagged in: ${message.guild.name}`, 
                        iconURL: message.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL()
                    })
                    .setThumbnail(message.guild.iconURL({ dynamic: true }) || message.author.displayAvatarURL())
                    .setDescription(`### Notification\n\nYou were tagged in **${message.guild.name}**!\n\n**Channel:** <#${message.channel.id}>\n**Tagged by:** ${message.author}\n\n**Message:**\n> ${message.content.substring(0, 500) || "*(Empty or Message Link)*"}\n\n[Jump to Message](${message.url})`)
                    .setTimestamp()
                    .setFooter({ text: `Message ID: ${message.id} • interX Secure` });

                await owner.send({ embeds: [embed] }).catch(() => {
                    console.error("⚠️ [Mention-Logger] Could not DM owner. They might have DMs closed.");
                });
            } catch (err) {
                console.error("❌ [Mention-Logger] Error in mention handler:", err);
            }
        }
    });

    console.log("📂 [Mention-Logger] Mention logger system initialized.");
};
