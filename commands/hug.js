const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "hug",
    description: "FUN command: hug",
    category: "fun",
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const result = Math.floor(Math.random() * 100);
        
        const responses = {
            howgay: `🏳️‍🌈 **${target.username}** is **${result}%** gay!`,
            lesbian: `👭 **${target.username}** is **${result}%** lesbian!`,
            horny: `🔥 **${target.username}** is **${result}%** horny!`,
            intelligence: `🧠 **${target.username}**'s intelligence level is **${result}%**!`,
            cute: `✨ **${target.username}** is **${result}%** cute!`,
            tharki: `👀 **${target.username}** is **${result}%** tharki!`,
            chutiya: `🤡 **${target.username}** is **${result}%** chutiya!`,
            '8ball': `🔮 **8-Ball Answer:** ${["Yes", "No", "Maybe", "Most Likely", "Never", "Ask again later"][Math.floor(Math.random()*6)]}`
        };

        const currentCmd = "hug";
        const defaultMsg = `✨ **${currentCmd.toUpperCase()}** Protocol engaged for ${target}!`;
        const content = responses[currentCmd] || defaultMsg;

        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle(`✨ [ ${currentCmd.toUpperCase()} ]`)
            .setDescription(content)
            .setFooter({ text: "interX Sovereign • Fun Protocol" })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};