const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'commands');
const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
let changedCount = 0;

for (const file of files) {
    const filePath = path.join(commandsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // 1) Handle member.id / target.id / id === BOT_OWNER_ID
    // Before: if (member.id === BOT_OWNER_ID || ...)
    // After:  if ((member.id === BOT_OWNER_ID || member.id === BOT_DEV_ID) || ...)
    
    // Pattern 1: target.id === BOT_OWNER_ID
    content = content.replace(/(?<!BOT_DEV_ID \|\| )(target\.id === BOT_OWNER_ID)/g, '(target.id === BOT_OWNER_ID)');
    // Pattern 2: member.id === BOT_OWNER_ID
    content = content.replace(/(?<!BOT_DEV_ID \|\| )(member\.id === BOT_OWNER_ID)/g, '(member.id === BOT_OWNER_ID || member.id === BOT_DEV_ID)');
    // Pattern 3: id === BOT_OWNER_ID (used in massban)
    content = content.replace(/(?<!BOT_DEV_ID \|\| )(id === BOT_OWNER_ID)(?![ |])/g, '(id === BOT_OWNER_ID || id === BOT_DEV_ID)');

    // 2) Handle string literals and template literals for "owner" vs "authority"
    // "the **Architect** of this system" -> "a **System Architect**"
    content = content.replace(/the \*\*Architect\*\* of this system/g, 'a **System Architect**');
    content = content.replace(/Cannot move the Owner/g, 'Cannot move a System Authority');

    if (content !== fs.readFileSync(filePath, 'utf-8')) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated protection in ${file}`);
        changedCount++;
    }
}

// Also update index.js check for authorizedIds in guildMemberUpdate (if exists)
const indexPath = path.join(__dirname, 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf-8');
if (indexContent.includes('targetId === BOT_OWNER_ID') && !indexContent.includes('targetId === BOT_DEV_ID')) {
    indexContent = indexContent.replace('targetId === BOT_OWNER_ID', '(targetId === BOT_OWNER_ID || targetId === BOT_DEV_ID)');
    fs.writeFileSync(indexPath, indexContent);
    console.log(`Updated index.js protection`);
}

console.log(`Total files updated for protection: ${changedCount}`);
