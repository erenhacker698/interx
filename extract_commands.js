const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');

        // Simple regex extraction to avoid require() issues if dependencies are missing
        const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
        const descMatch = content.match(/description:\s*["']([^"']+)["']/);
        // Aliases can be ["a", "b"] or ['a', 'b']
        const aliasesMatch = content.match(/aliases:\s*\[(.*?)\]/s);

        if (nameMatch) {
            let aliases = [];
            if (aliasesMatch) {
                const aliasStr = aliasesMatch[1];
                // clean up quotes
                aliases = aliasStr.split(',').map(a => a.trim().replace(/['"]/g, '')).filter(a => a);
            }

            commands.push({
                name: nameMatch[1],
                description: descMatch ? descMatch[1] : "No description",
                aliases: aliases,
                filename: file
            });
        }
    } catch (err) {
        console.error(`Error reading ${file}: ${err.message}`);
    }
}

console.log(JSON.stringify(commands, null, 2));
