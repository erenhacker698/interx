const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

console.log(`🔍 Scanning ${files.length} command files...`);

let errors = 0;
for (const file of files) {
    try {
        require(`./commands/${file}`);
        console.log(`✅ ${file} loaded successfully.`);
    } catch (err) {
        console.error(`❌ Failed to load ${file}:`);
        console.error(err);
        errors++;
    }
}

if (errors === 0) {
    console.log('\n✨ All commands loaded successfully!');
    process.exit(0);
} else {
    console.log(`\n⚠️ Found ${errors} error(s).`);
    process.exit(1);
}
