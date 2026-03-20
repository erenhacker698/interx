const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, '../commands');

const funCommands = [
    'mydog', 'chat', 'translate', 'howgay', 'lesbian', 'cute', 'intelligence', 
    'chutiya', 'horny', 'tharki', 'gif', 'iplookup', 'weather', 'hug', 'kiss', 
    'pat', 'cuddle', 'slap', 'tickle', 'spank', 'ngif', '8ball', 'truth', 'dare'
];

const gameCommands = [
    'blackjack', 'chess', 'tic-tac-toe', 'country-guesser', 'rps', 'lights-out', 
    'wordle', '2048', 'memory-game', 'number-slider', 'battleship', 'connect-four'
];

const template = (name, category) => `const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "${name}",
    description: "${category.toUpperCase()} command: ${name}",
    category: "${category}",
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const result = Math.floor(Math.random() * 100);
        
        const responses = {
            howgay: \`🏳️‍🌈 **\${target.username}** is **\${result}%** gay!\`,
            lesbian: \`👭 **\${target.username}** is **\${result}%** lesbian!\`,
            horny: \`🔥 **\${target.username}** is **\${result}%** horny!\`,
            intelligence: \`🧠 **\${target.username}**'s intelligence level is **\${result}%**!\`,
            cute: \`✨ **\${target.username}** is **\${result}%** cute!\`,
            tharki: \`👀 **\${target.username}** is **\${result}%** tharki!\`,
            chutiya: \`🤡 **\${target.username}** is **\${result}%** chutiya!\`,
            '8ball': \`🔮 **8-Ball Answer:** \${\["Yes", "No", "Maybe", "Most Likely", "Never", "Ask again later"\][Math.floor(Math.random()*6)]}\`
        };

        const defaultMsg = \`✨ **\${name.toUpperCase()}** Protocol engaged for \${target}!\`;
        const content = responses["${name}"] || defaultMsg;

        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle(\`✨ [ \${name.toUpperCase()} ]\`)
            .setDescription(content)
            .setFooter({ text: "interX Sovereign • Fun Protocol" })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};`;

// Generate Fun Files
funCommands.forEach(name => {
    const filePath = path.join(commandsDir, `${name}.js`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, template(name, "fun"));
    }
});

// Generate Game placeholders (to be expanded)
gameCommands.forEach(name => {
    const filePath = path.join(commandsDir, `${name}.js`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, template(name, "games"));
    }
});

console.log("✅ [FunPack] 36+ fun and game modules generated successfully.");
