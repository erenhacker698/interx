const fs = require('fs');
const path = require('path');

const cmdsDir = path.join(__dirname, 'commands');

function processDir(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // 1) Handle requires
            if (content.includes('BOT_OWNER_ID') && !content.includes('BOT_DEV_ID') && content.includes('../config')) {
                content = content.replace(/(const\s*\{\s*[^}]*\b)BOT_OWNER_ID(\b[^}]*\}\s*=\s*require\(["']\.\.\/config["']\);)/, '$1BOT_OWNER_ID, BOT_DEV_ID$2');
                modified = true;
            }

            // 2) Handle conditions without skipping due to BOT_DEV_ID present
            const oldMessageAuthorCheck = /message\.author\.id === BOT_OWNER_ID/g;
            if (oldMessageAuthorCheck.test(content) && !content.includes('message.author.id === BOT_DEV_ID')) {
                content = content.replace(oldMessageAuthorCheck, '(message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID)');
                modified = true;
            }

            const oldMessageAuthorNotCheck = /message\.author\.id !== BOT_OWNER_ID/g;
            if (oldMessageAuthorNotCheck.test(content) && !content.includes('message.author.id !== BOT_DEV_ID')) {
                content = content.replace(oldMessageAuthorNotCheck, '(message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)');
                modified = true;
            }

            const oldInteractionCheck = /interaction\.user\.id === BOT_OWNER_ID/g;
            if (oldInteractionCheck.test(content) && !content.includes('interaction.user.id === BOT_DEV_ID')) {
                content = content.replace(oldInteractionCheck, '(interaction.user.id === BOT_OWNER_ID || interaction.user.id === BOT_DEV_ID)');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${file}`);
            }
        }
    }
}

processDir(cmdsDir);
console.log('Done mapping BOT_DEV_ID to commands round 2.');
