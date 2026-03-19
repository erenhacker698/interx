const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID, EMBED_COLOR } = require("../config");

module.exports = {
    name: "devinfo",
    description: "Displays developer and bot architecture information",
    aliases: ["dev", "credits", "aboutdev"],

    async execute(message) {
        const clientUser = message.client.user;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR || "#FF1A1A")
            .setAuthor({
                name: "interX • Premium Security Architecture",
                iconURL: clientUser.displayAvatarURL({ size: 1024, dynamic: true })
            })
            .setThumbnail(clientUser.displayAvatarURL({ size: 1024, dynamic: true }))
            .setDescription(
                "### 🛡️ Sovereign Core Intelligence\n" +
                "> Welcome to **interX**, a paramount defense & moderation protocol designed for uninterrupted sovereignty.\n\n" +
                "**👑 Lead Architect & Owner**\n" +
                `└ <@${BOT_OWNER_ID}>\n\n` +
                "**🧠 System Mentor & Visionary**\n" +
                `└ <@${BOT_DEV_ID}>\n`
            )
            .addFields(
                {
                    name: "⚙️ Architecture Protocol",
                    value: "```yaml\nRuntime: Node.js\nLibrary: Discord.js v14\nCore: interX v2.1\n```",
                    inline: true
                },
                {
                    name: "📡 Network Analytics",
                    value: "```yaml\nStatus: Online & Secure\nDefense: Active\nLatency: " + message.client.ws.ping + "ms\n```",
                    inline: true
                }
            )
            .setImage("https://media.discordapp.net/attachments/1462030670250381520/1467468087048667360/228552bb6bdd183da62941c007097034_2-1.gif?ex=69b5e268&is=69b490e8&hm=cc22146d176f1c2a49341d9c2e011fef48eac6faf61126c98818a75c3a7f6231&=")
            .setFooter({
                text: "interX System Authority • Red Protocol",
                iconURL: clientUser.displayAvatarURL()
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Integrate interX")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=8&scope=bot%20applications.commands`)
        );

        message.reply({ embeds: [embed], components: [row] });
    }
};
