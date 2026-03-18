/**
 * MASS CONVERTER: V2 Components → Red Embed UI
 * Converts all command files from V2.container/V2.text/V2.section
 * to EmbedBuilder with a unified red theme.
 */
const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = path.join(__dirname, 'commands');
const SKIP_FILES = ['help.js']; // Already converted

let converted = 0;
let skipped = 0;

const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));

for (const file of files) {
  if (SKIP_FILES.includes(file)) {
    console.log(`⏭️  Skipping ${file} (already converted)`);
    skipped++;
    continue;
  }

  const filePath = path.join(COMMANDS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Only process files that use V2
  if (!content.includes('V2.container') && !content.includes('V2.text') && !content.includes('V2.heading') && !content.includes('V2.flag')) {
    console.log(`⏭️  Skipping ${file} (no V2 usage)`);
    skipped++;
    continue;
  }

  // ═══════════════════════════════════════════════════
  // STEP 1: Fix imports — add EmbedBuilder, keep rest
  // ═══════════════════════════════════════════════════

  // Remove V2 require lines
  content = content.replace(/const V2 = require\(["']\.\.\/utils\/v2Utils["']\);\s*\n?/g, '');
  content = content.replace(/const V2 = require\(["']\.\.\/utils\/v2Utils["']\);\s*\r?\n?/g, '');
  
  // Remove duplicate V2 requires inside execute
  content = content.replace(/\s*const V2 = require\(["']\.\.\/utils\/v2Utils["']\);\s*/g, '\n');

  // Add EmbedBuilder to discord.js import if not present
  if (!content.includes('EmbedBuilder')) {
    content = content.replace(
      /const\s*\{([^}]+)\}\s*=\s*require\(["']discord\.js["']\)/,
      (match, imports) => {
        if (!imports.includes('EmbedBuilder')) {
          return `const { ${imports.trim()}, EmbedBuilder } = require("discord.js")`;
        }
        return match;
      }
    );
    // If there's no discord.js import at all, add one
    if (!content.includes("require(\"discord.js\")") && !content.includes("require('discord.js')")) {
      content = `const { EmbedBuilder } = require("discord.js");\n` + content;
    }
  }

  // Fix config imports — replace V2_BLUE, V2_RED with EMBED_COLOR
  content = content.replace(/,\s*V2_BLUE/g, '');
  content = content.replace(/,\s*V2_RED/g, '');
  content = content.replace(/V2_BLUE,\s*/g, '');
  content = content.replace(/V2_RED,\s*/g, '');
  content = content.replace(/{\s*V2_BLUE\s*}/g, '{ }');
  content = content.replace(/{\s*V2_RED\s*}/g, '{ }');

  // ═══════════════════════════════════════════════════
  // STEP 2: Convert V2 send patterns to embed sends
  // ═══════════════════════════════════════════════════

  // Pattern: message.reply/send({ content: null, flags: V2.flag, components: [V2.container([...], color)] })
  // Convert to: message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033)...] })

  // Replace V2.flag references
  content = content.replace(/flags:\s*V2\.flag,?\s*/g, '');
  
  // Replace simple V2.container one-liners with embed equivalent
  // V2.container([V2.heading("TITLE", N), V2.text("content")], COLOR) 
  // → new EmbedBuilder().setColor(0xFF0033).setTitle("TITLE").setDescription("content")
  
  // Complex multi-line V2.container blocks — convert to embeds
  // This handles the common pattern of V2.container with V2.heading + V2.text
  content = content.replace(
    /V2\.container\(\[\s*V2\.heading\(["']([^"']+)["'],\s*\d+\),\s*V2\.text\(["']([^"']+)["']\)\s*\],?\s*(?:V2_RED|V2_BLUE|["']#[A-Fa-f0-9]+["'])?\)/g,
    'new EmbedBuilder().setColor(0xFF0033).setTitle("$1").setDescription("$2").setFooter({ text: "interX • Security" }).setTimestamp()'
  );

  // Handle V2.container with template literals for V2.text
  content = content.replace(
    /V2\.container\(\[\s*V2\.heading\(["']([^"']+)["'],\s*\d+\),\s*V2\.text\((`[^`]+`)\)\s*\],?\s*(?:V2_RED|V2_BLUE|["']#[A-Fa-f0-9]+["'])?\)/g,
    'new EmbedBuilder().setColor(0xFF0033).setTitle("$1").setDescription($2).setFooter({ text: "interX • Security" }).setTimestamp()'
  );

  // Handle larger V2.container blocks with sections — convert to embeds 
  // Replace remaining V2.container calls that have V2.section inside
  content = content.replace(
    /V2\.container\(\[\s*V2\.section\(\s*\[\s*V2\.heading\(["']([^"']+)["'],\s*\d+\),\s*V2\.text\((`[^`]+`|"[^"]*"|'[^']*')\)\s*\],\s*([^)]+)\),\s*V2\.separator\(\),\s*(?:V2\.heading\(["']([^"']+)["'],\s*\d+\),\s*)?V2\.text\((`[^`]+`|"[^"]*"|'[^']*')\)(?:,\s*V2\.separator\(\),?\s*(?:V2\.text\((`[^`]+`|"[^"]*"|'[^']*')\))?)?\s*\],?\s*(?:V2_RED|V2_BLUE|["']#[A-Fa-f0-9]+["'])?\)/g,
    (match, title, desc, thumb, subTitle, field1, footer) => {
      let embed = `new EmbedBuilder().setColor(0xFF0033).setTitle("${title}").setDescription(${desc})`;
      if (subTitle) embed += `.addFields({ name: "${subTitle}", value: ${field1} })`;
      else if (field1) embed += `.addFields({ name: "📋 Details", value: ${field1} })`;
      if (footer) embed += `.addFields({ name: "\\u200b", value: ${footer} })`;
      embed += `.setFooter({ text: "interX • Security" }).setTimestamp()`;
      return embed;
    }
  );

  // ═══════════════════════════════════════════════════
  // STEP 3: Replace remaining V2 patterns
  // ═══════════════════════════════════════════════════

  // Replace components: [...] with embeds: [...] for V2 sends  
  content = content.replace(/components:\s*\[\s*(new EmbedBuilder\(\))/g, 'embeds: [$1');

  // If there are still remaining V2.container that weren't caught,
  // wrap them in a simple embed fallback
  if (content.includes('V2.container')) {
    // For remaining complex V2.container calls, just replace the send pattern
    content = content.replace(
      /\{\s*content:\s*null,\s*components:\s*\[V2\.container\(\[([^\]]*(?:\[[^\]]*\])*[^\]]*)\],?\s*(?:V2_RED|V2_BLUE|["']#[A-Fa-f0-9]+["'])?\)\]\s*\}/g,
      (match, innerContent) => {
        // Extract text content from V2 calls
        const texts = [];
        const headingMatch = innerContent.match(/V2\.heading\(["']([^"']+)["']/);
        const textMatches = [...innerContent.matchAll(/V2\.text\((?:["']([^"']+)["']|(`[^`]+`))\)/g)];
        
        const title = headingMatch ? headingMatch[1] : "interX";
        textMatches.forEach(m => texts.push(m[1] || m[2]));
        
        const desc = texts.length > 0 ? texts[0] : '""';
        return `{ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("${title}").setDescription(${desc.startsWith('`') ? desc : `"${desc}"`}).setFooter({ text: "interX • Security" }).setTimestamp()] }`;
      }
    );
  }

  // Clean up any remaining V2.flag references
  content = content.replace(/flags:\s*V2\.flag,?\s*/g, '');
  content = content.replace(/,?\s*flags:\s*V2\.flag/g, '');

  // Clean up remaining V2. calls that are standalone (not in container)
  // V2.text("something") → "something" (just the string)
  content = content.replace(/V2\.text\((".*?")\)/g, '$1');
  content = content.replace(/V2\.text\((`.*?`)\)/g, '$1');
  
  // V2.heading("something", N) → "### something"
  content = content.replace(/V2\.heading\((".*?"),\s*\d+\)/g, '$1');
  
  // V2.separator() → "" (remove)
  content = content.replace(/V2\.separator\(\),?\s*/g, '');

  // V2.botAvatar(message) → message.client.user.displayAvatarURL()
  content = content.replace(/V2\.botAvatar\(message\)/g, 'message.client.user.displayAvatarURL()');
  content = content.replace(/V2\.botAvatar\(\{ guild.*?\}\)/g, 'message.client.user.displayAvatarURL()');

  // Clean up empty config imports
  content = content.replace(/const\s*\{\s*\}\s*=\s*require\(["']\.\.\/config["']\);\s*\n?/g, '');
  
  // Clean up double newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Clean up trailing commas in objects
  content = content.replace(/,\s*\}/g, ' }');
  content = content.replace(/,\s*\]/g, ' ]');

  fs.writeFileSync(filePath, content);
  console.log(`✅  Converted: ${file}`);
  converted++;
}

console.log(`\n════════════════════════════════`);
console.log(`✅ Converted: ${converted} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
console.log(`════════════════════════════════`);
