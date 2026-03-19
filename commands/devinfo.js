const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID, EMBED_COLOR } = require("../config");

module.exports = {
    name: "devinfo",
    description: "Displays developer and bot architecture information",
    aliases: ["dev", "credits", "aboutdev"],

    async execute(message) {
        const clientUser = message.client.user;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR || "#FF1A1A") // Red Theme
            .setAuthor({
                name: "INTERX • SYSTEM ARCHITECTS",
                iconURL: clientUser.displayAvatarURL({ dynamic: true })
            })
            .setThumbnail(clientUser.displayAvatarURL({ dynamic: true, size: 2048 }))
            .setDescription(
                "```ansi\n" +
                "\u001b[2;31minterX CORE SYSTEM DATA\u001b[0m\n" +
                "```\n" +
                "> Welcome to **interX** — an elite defense, administration, and moderation protocol designed for total sovereignty."
            )
            .addFields(
                {
                    name: "👑 Lead Developer",
                    value: `> <@${BOT_OWNER_ID}>`,
                    inline: true
                },
                {
                    name: "🧠 Mentor / Guide",
                    value: `> <@${BOT_DEV_ID}>`,
                    inline: true
                },
                {
                    name: "⚙️ Runtime",
                    value: "`Node.js` • `Discord.js v14`",
                    inline: true
                },
                {
                    name: "🧬 System Architecture",
                    value: "`interX Sovereign Core v2.1`",
                    inline: true
                },
                {
                    name: "🛡️ Security Protocol",
                    value: "`Military Grade Anti-Nuke System`",
                    inline: true
                },
                {
                    name: "📡 System Latency",
                    value: `\`${message.client.ws.ping}ms\``,
                    inline: true
                }
            )
            .setImage("https://media.discordapp.net/attachments/1462030670250381520/1467468087048667360/228552bb6bdd183da62941c007097034_2-1.gif?ex=69b5e268&is=69b490e8&hm=cc22146d176f1c2a49341d9c2e011fef48eac6faf61126c98818a75c3a7f6231&=")
            .setFooter({
                text: "interX • Red Protocol • System Authority",
                iconURL: clientUser.displayAvatarURL({ dynamic: true })
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
