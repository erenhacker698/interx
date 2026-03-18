const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const missingDescription = [];
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (!command.description) {
        missingDescription.push(file);
    }
}

if (missingDescription.length > 0) {
    console.log('Commands missing description:', missingDescription);
} else {
    console.log('All commands have descriptions.');
}
