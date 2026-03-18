const fs = require('fs');
const path = require('path');

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                checkDir(fullPath);
            }
        } else if (file.endsWith('.js')) {
            try {
                require('vm').runInNewContext(fs.readFileSync(fullPath, 'utf8'));
            } catch (e) {
                if (e instanceof SyntaxError) {
                    console.log(`Error in ${fullPath}: ${e.message}`);
                }
            }
        }
    }
}

checkDir(process.cwd());
