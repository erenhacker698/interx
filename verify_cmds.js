
const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Checking ${files.length} commands...`);
let errors = 0;

for (const file of files) {
    try {
        const cmd = require(path.join(commandsPath, file));
        if (!cmd.name) {
            console.log(`❌ ${file}: Missing name`);
            errors++;
        }
        if (typeof cmd.execute !== 'function') {
            console.log(`❌ ${cmd.name || file}: Missing execute function`);
            errors++;
        }
    } catch (e) {
        console.log(`❌ ${file}: Critical Error - ${e.message}`);
        errors++;
    }
}

if (errors === 0) {
    console.log('✅ All commands loaded successfully.');
} else {
    console.log(`⚠️ Completed with ${errors} errors.`);
}
process.exit(errors > 0 ? 1 : 0);
