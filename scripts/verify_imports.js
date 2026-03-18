const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, '../commands');
const FILES = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));

const KNOWN_EXPORTS = [
    'EmbedBuilder', 'ActionRowBuilder', 'ButtonBuilder', 'ButtonStyle',
    'StringSelectMenuBuilder', 'StringSelectMenuOptionBuilder', 'PermissionsBitField',
    'ChannelType', 'AttachmentBuilder', 'ComponentType'
];

let errors = [];

FILES.forEach(file => {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
    const importsMatch = content.match(/require\("discord\.js"\)/);

    if (!importsMatch) {
        // Maybe it uses require('discord.js') but not destructuring?
        // Or maybe it doesn't import discord.js at all but uses EmbedBuilder?
    }

    // simplistic check: find "new X()" and check if "X" is imported
    KNOWN_EXPORTS.forEach(exp => {
        if (content.includes(`new ${exp}`) || content.includes(exp + '.')) {
            // Check if it's imported
            // const { ... Exp ... } = require("discord.js")
            const importRegex = new RegExp(`const\\s+\\{[^}]*\\b${exp}\\b[^}]*\\}\\s*=\\s*require\\(["']discord\\.js["']\\)`);
            if (!importRegex.test(content)) {
                // strict check failed, maybe manual require?
                if (!content.includes(`${exp} = require`)) {
                    errors.push(`[${file}] Uses '${exp}' but might be missing import.`);
                }
            }
        }
    });

    try {
        require(path.join(COMMANDS_DIR, file));
    } catch (e) {
        errors.push(`[${file}] CRITICAL: Failed to load: ${e.message}`);
    }
});

if (errors.length > 0) {
    console.error("❌ ERRORS FOUND:");
    console.error(errors.join('\n'));
} else {
    console.log("✅ All commands passed static analysis.");
}
