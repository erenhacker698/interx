const { EmbedBuilder } = require("discord.js");
module.exports = {
    name: "banner",
    description: "Displays a user's banner with a premium reference-matched layout",

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();
        const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        // Check if user is trying to SET a banner
        const url = message.attachments.first()?.url || args.find(arg => arg.startsWith("http://") || arg.startsWith("https://"));

        if (url && (args[0] === "set" || (isBotOwner || isServerOwner))) {
            // Forward to setguildbanner command
            const setCmd = message.client.commands.get("setguildbanner");
            if (setCmd && (isBotOwner || isServerOwner)) {
                return setCmd.execute(message, args);
            }
        }

        const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(args[0]) ||
            message.member;

        const user = await member.user.fetch(); // Need to fetch user to get banner data
        const bannerURL = user.bannerURL({ size: 1024, dynamic: true });

        if (!bannerURL) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription(`⚠️ **${user.username}** does not have a banner.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const pngURL = user.bannerURL({ extension: 'png', size: 1024 });
        const jpgURL = user.bannerURL({ extension: 'jpg', size: 1024 });
        const webpURL = user.bannerURL({ extension: 'webp', size: 1024 });

        const container = V2.container([
            V2.section(
                [
                    `**Time:** ${new Date().toLocaleTimeString()}`,
                    `🔹 **Executed by:** <@${message.author.id}>`
                ],
                botAvatar
            ),
            `🖼️ **${user.username}'s Banner**`,
            `**Banner URL:**\n${bannerURL}`,
            `🔗 **Download Links:**\n[PNG](${pngURL}) | [JPG](${jpgURL}) | [WEBP](${webpURL})`
        ], "#0099ff");

        message.reply({
            content: null,
            components: [container]
        });
    }
};
