const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "devinfo",
    description: "Displays developer and bot architecture information",
    aliases: ["dev", "credits", "aboutdev"],

    async execute(message) {
        const clientUser = message.client.user;

        const embed = new EmbedBuilder()
            .setColor("#FF1A1A") // Red Theme
            .setAuthor({
                name: "INTERX • SYSTEM ARCHITECTS",
                iconURL: clientUser.displayAvatarURL()
            })
            .setThumbnail(clientUser.displayAvatarURL())

            .setDescription(
                "```ansi\n" +
                "\u001b[2;31minterX CORE SYSTEM DATA\u001b[0m\n" +
                "```"
            )

            .addFields(
                {
                    name: "👑 Lead Developer",
                    value: `<@${BOT_OWNER_ID}>`,
                    inline: true
                },
                {
                    name: "🧠 Mentor / Guide",
                    value: `<@783953632974471178>`,
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
                text: "BlueSealPrime x interX • Red Protocol • System Authority",
                iconURL: clientUser.displayAvatarURL()
            })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};
