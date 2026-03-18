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
            const configReq = /(const\s*\{\s*[^}]*\b)BOT_OWNER_ID(\b[^}]*\}\s*=\s*require\(["']\.\.\/config["']\);)/;
            if (configReq.test(content)) {
                const match = content.match(configReq);
                if (match[0].indexOf('BOT_DEV_ID') === -1) {
                    content = content.replace(configReq, '$1BOT_OWNER_ID, BOT_DEV_ID$2');
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated imports in ${file}`);
            }
        }
    }
}

processDir(cmdsDir);
console.log('Done mapping BOT_DEV_ID to imports.');
