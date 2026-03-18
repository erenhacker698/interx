const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const getCommandFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getCommandFiles(path.join(dir, item.name))];
        } else if (item.name.endsWith('.js')) {
            files.push(path.join(dir, item.name));
        }
    }
    return files;
};

const allCommandFiles = getCommandFiles(commandsPath);

for (const filePath of allCommandFiles) {
    if (commands.length >= 100) break; // Discord limit

    const file = path.basename(filePath);
    
    // Skip God Mode and Extra Owner commands for slash commands
    if (file.startsWith('god_') || file.startsWith('e') || file === 'eval.js' || file === 'exec.js') continue;

    try {
        const command = require(filePath);
        
        // 1. Prioritize custom slash data (SlashCommandBuilder) if defined
        if (command.data) {
            console.log(`🔍 Processing Custom Data: ${file}`);
            commands.push(command.data.toJSON());
            continue;
        }

        // 2. Fallback to generic command generation for legacy modules
        if (command.name && command.description) {
            console.log(`📦 Processing Generic Command: ${file} [${command.name}]`);
            const slashCommand = new SlashCommandBuilder()
                .setName(command.name.toLowerCase())
                .setDescription(command.description.substring(0, 100)); // Discord limit 100 chars

            // Add a generic 'input' option to capture arguments
            slashCommand.addStringOption(option =>
                option.setName('input')
                .setDescription('Command arguments')
                .setRequired(false)
            );

            commands.push(slashCommand.toJSON());
        }
    } catch (err) {
        console.error(`❌ Error loading ${file}: ${err.message}`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        // Extract Client ID from Token (First part of token is Base64 encoded ID)
        const clientId = Buffer.from(process.env.TOKEN.split('.')[0], 'base64').toString();
        console.log(`📡 Detected Client ID: ${clientId}`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
