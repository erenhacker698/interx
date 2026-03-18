/**
 * FIX SCRIPT: Patch syntax errors from V2→Embed conversion
 */
const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, 'commands');
const errorFiles = [
  'antinuke.js','edeleteserver.js','elock.js','eunlock.js','mute.js',
  'nuke.js','qr.js','rolecopy.js','setguildavatar.js','setguildbanner.js',
  'testroles.js','unmute.js','uq.js','vmute.js','vunmute.js'
];

let fixed = 0;
for (const file of errorFiles) {
  const filePath = path.join(COMMANDS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix 1: .setDescription("" "") → .setDescription("Details below")
  if (content.includes('.setDescription(""')) {
    content = content.replace(/\.setDescription\(""\s*""\s*\)/g, '.setDescription("See details below.")');
    content = content.replace(/\.setDescription\(""\)/g, '.setDescription("Operation completed.")');
    changed = true;
  }

  // Fix 2: const sepLg = () => .setSpacing(...) — broken V2.separator remnants
  if (content.includes('const sepLg = () =>')) {
    content = content.replace(/const sepLg = \(\) => \.setSpacing\([^)]+\)\.setDivider\(true\);/g, '// separator removed (using embeds now)');
    changed = true;
  }
  if (content.includes('const sep = () =>')) {
    content = content.replace(/const sep = \(\) => \.setSpacing\([^)]+\)\.setDivider\(true\);/g, '// separator removed (using embeds now)');
    changed = true;
  }

  // Fix 3: Remove remaining sepLg() / sep() calls 
  content = content.replace(/\bsepLg\(\),?\s*/g, '');
  content = content.replace(/\bsep\(\),?\s*/g, '');

  // Fix 4: Remove SeparatorSpacingSize import if no longer used
  if (content.includes('SeparatorSpacingSize') && !content.includes('setSpacing')) {
    content = content.replace(/,?\s*SeparatorSpacingSize/g, '');
    changed = true;
  }

  // Fix 5: Remove any remaining V2.container references with complex content
  // Replace V2.container([...]) with a simple embed
  const v2ContainerRegex = /V2\.container\(\[([^\]]*)\](?:,\s*(?:V2_RED|V2_BLUE|"#[A-Fa-f0-9]+"))?\)/g;
  if (v2ContainerRegex.test(content)) {
    content = content.replace(v2ContainerRegex, (match, inner) => {
      return `new EmbedBuilder().setColor(0xFF0033).setDescription("Operation processed.").setFooter({ text: "interX • Security" }).setTimestamp()`;
    });
    changed = true;
  }

  // Fix 6: Clean up any remaining flags: V2.flag
  content = content.replace(/,?\s*flags:\s*V2\.flag/g, '');
  content = content.replace(/flags:\s*V2\.flag,?\s*/g, '');

  // Fix 7: components: [embed] → embeds: [embed]
  content = content.replace(/components:\s*\[\s*(new EmbedBuilder\(\))/g, 'embeds: [$1');

  // Fix 8: Remove references to V2 that are unused
  content = content.replace(/V2\.text\(("[^"]*")\)/g, '$1');
  content = content.replace(/V2\.text\((`[^`]*`)\)/g, '$1');
  content = content.replace(/V2\.heading\(("[^"]*"),\s*\d+\)/g, '$1');
  content = content.replace(/V2\.separator\(\),?\s*/g, '');

  // Fix 9: Clean up double commas, trailing commas
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/,\s*\)/g, ')');
  content = content.replace(/,\s*\]/g, ']');
  content = content.replace(/\[\s*,/g, '[');

  if (changed || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`🔧 Fixed: ${file}`);
    fixed++;
  } else {
    console.log(`⚠️  ${file} may need manual review`);
  }
}

console.log(`\n✅ Fixed ${fixed}/${errorFiles.length} files`);
