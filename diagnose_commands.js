const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log(`Initialising diagnostic check for ${commandFiles.length} commands...`);

let passed = 0;
let failed = 0;

for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        // Clear cache to ensure fresh load
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command.name) {
            console.error(`❌ [FAIL] ${file}: Missing 'name' property.`);
            failed++;
        } else if (!command.execute) {
            console.error(`❌ [FAIL] ${file}: Missing 'execute' function.`);
            failed++;
        } else {
            // console.log(`✅ [PASS] ${file}`);
            passed++;
        }
    } catch (error) {
        console.error(`❌ [CRITICAL FAIL] ${file}: failed to load.`);
        console.error(error);
        failed++;
    }
}

console.log(`\nDiagnostic Complete.`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
