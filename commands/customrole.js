const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/customroles.json");

module.exports = {
    name: "customrole",
    description: "👑 interX Private Utility: Custom Roles",
    aliases: ["cr", "myrole", "roleme"],
    usage: "!customrole <create | delete | rename | color | icon>",

    async execute(message, args) {
        // 🛡️ SECURITY: Only allow for Boosters or a specific role (or owners)
        const isBooster = message.member.premiumSince !== null;
        const isBotOwner = global.V2?.botOwnerId === message.author.id;
        
        // Configuration: Which role allows custom roles? (e.g. VIP role)
        const VIP_ROLE_ID = "0"; // Replace with actual VIP ID or leave "0" to only allow Boosters/Owners

        if (!isBooster && !isBotOwner && !message.member.roles.cache.has(VIP_ROLE_ID)) {
            return message.reply({
                components: [V2.container([
                    "🚫 ACCESS DENIED",
                    "### **Protocol: PRIVILEGE_INSUFFICIENT**\n> Custom roles are reserved for **Server Boosters** and **Sovereign Entities** only."
                ], "#df0000")]
            });
        }

        const data = loadData();
        const userRoleId = data[message.guild.id]?.[message.author.id];
        const subCommand = args[0]?.toLowerCase();

        // 1. CREATE
        if (subCommand === "create") {
            if (userRoleId) return message.reply("⚠️ **ALREADY EXISTS:** You already have a custom role node in this sector.");

            const name = args.slice(1, -1).join(" ") || `Sovereign: ${message.author.username}`;
            const color = args[args.length - 1] || "#808080";

            if (!color.startsWith("#") || color.length !== 7) {
                return message.reply("❌ **INVALID COLOR:** Use a Hex code (e.g. `#df0000`). Usage: `!cr create <name> <#hex>`");
            }

            try {
                const role = await message.guild.roles.create({
                    name: name,
                    color: color,
                    reason: `interX Custom Role for ${message.author.tag}`,
                    position: message.guild.members.me.roles.highest.position - 1
                });

                await message.member.roles.add(role);

                if (!data[message.guild.id]) data[message.guild.id] = {};
                data[message.guild.id][message.author.id] = role.id;
                saveData(data);

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle("👑 CUSTOM ROLE ESTABLISHED")
                    .setDescription(`### **Protocol: ROLE_INITIALIZED**\n> **Name:** \`${name}\`\n> **Color:** \`${color}\`\n> **Target:** ${message.author}\n\n*Your identity has been prioritized in the server hierarchy.*`)
                    .setFooter({ text: "interX Sovereign • Identity Node" })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } catch (err) {
                console.error(err);
                return message.reply("❌ **FATAL ERROR:** Failed to generate role. Ensure target position is below my authority.");
            }
        }

        // 2. DELETE
        if (subCommand === "delete" || subCommand === "remove") {
            if (!userRoleId) return message.reply("❌ **REGISTRY EMPTY:** No custom role found for your account.");

            const role = message.guild.roles.cache.get(userRoleId);
            if (role) await role.delete().catch(() => {});

            delete data[message.guild.id][message.author.id];
            saveData(data);

            return message.reply("🗑️ **PURGE COMPLETE:** Your custom role has been decommissioned.");
        }

        // 3. RENAME
        if (subCommand === "rename" || subCommand === "name") {
            if (!userRoleId) return message.reply("❌ **NODE MISSING:** Create a role first via `!cr create`.");
            const newName = args.slice(1).join(" ");
            if (!newName) return message.reply("❌ **INPUT_ERROR:** Provide a new name.");

            const role = message.guild.roles.cache.get(userRoleId);
            if (!role) return message.reply("❌ **ORPHANED_DATA:** Your role was deleted manually. Purging local registry...");

            await role.setName(newName);
            return message.reply(`✅ **TRANSFORMATION COMPLETE:** Role renamed to **${newName}**.`);
        }

        // 4. COLOR
        if (subCommand === "color" || subCommand === "hex") {
            if (!userRoleId) return message.reply("❌ **NODE MISSING:** Create a role first.");
            const newColor = args[1];
            if (!newColor?.startsWith("#")) return message.reply("❌ **INPUT_ERROR:** Provide a valid Hex (e.g. `#df0000`).");

            const role = message.guild.roles.cache.get(userRoleId);
            if (!role) return message.reply("❌ **ORPHANED_DATA:** Role not found.");

            await role.setColor(newColor);
            return message.reply(`✅ **SPECTRUM_SHIFTED:** Role color updated to **${newColor}**.`);
        }

        // Help
        return message.reply({
            components: [V2.container([
                "👑 SOVEREIGN IDENTITY CUSTOMIZER",
                "### **Operations Commands**",
                `> \`!cr create <name> <#color>\` — Generate identity\n> \`!cr rename <name>\` — Change title\n> \`!cr color <#hex>\` — Shift spectrum\n> \`!cr delete\` — Purge identity node`,
                "*interX Identity Protocol*"
            ])]
        });
    }
};

function loadData() {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { return {}; }
}
function saveData(data) {
    if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
