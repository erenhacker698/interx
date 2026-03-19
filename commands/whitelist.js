const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, isBypass } = require("../utils/bypass_system.js");

const WHITELIST_PATH = path.join(__dirname, "../data/whitelist.json");

function loadWhitelist() {
    if (!fs.existsSync(WHITELIST_PATH)) {
        fs.writeFileSync(WHITELIST_PATH, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(WHITELIST_PATH, "utf8"));
    } catch (e) {
        return {};
    }
}

function saveWhitelist(data) {
    if (!fs.existsSync(path.dirname(WHITELIST_PATH))) {
        fs.mkdirSync(path.dirname(WHITELIST_PATH), { recursive: true });
    }
    fs.writeFileSync(WHITELIST_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "whitelist",
    aliases: ["wl"],
    description: "Grant administrative immunity to users or bots.",

    async execute(message, args) {
        const guildId = message.guild.id;
        const sub = args[0]?.toLowerCase();

        // 🛡️ SECURITY CHECK
        const isOwner = isBypass(message.author.id) || message.author.id === message.guild.ownerId;
        if (!isOwner) {
            const denied = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🔒 [ ACCESS_DENIED ]")
                .setDescription("### **AUTHORITY REQUIRED**\n> Only the **Bot Owner** or **Server Owner** can modify the security whitelist.")
                .setFooter({ text: "interX • Security Matrix" });
            return message.reply({ embeds: [denied] });
        }

        const whitelist = loadWhitelist();
        if (!whitelist[guildId]) whitelist[guildId] = [];
        // Support both old array format and object format for migration
        let ids = Array.isArray(whitelist[guildId]) ? whitelist[guildId] : Object.keys(whitelist[guildId]);

        if (!sub || sub === "help") {
            const help = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🛡️ SECURITY_WHITELIST_INTERFACE")
                .setDescription(
                    "### **Available Commands**\n" +
                    "> `!whitelist add @user/ID` - Grant immune status\n" +
                    "> `!whitelist remove @user/ID` - Revoke immune status\n" +
                    "> `!whitelist list` - View all authorized personnel"
                )
                .setFooter({ text: "interX • Security Protocol" });
            return message.reply({ embeds: [help] });
        }

        // ───── ADD LOGIC ─────
        if (sub === "add") {
            const target = message.mentions.users.first() || await message.client.users.fetch(args[1]).catch(() => null);
            if (!target) return message.reply("❌ **[ ERROR ]** Specify a valid user/bot mention or ID.");

            if (ids.includes(target.id)) return message.reply(`ℹ️ **${target.tag}** is already in the registry.`);

            ids.push(target.id);
            whitelist[guildId] = ids;
            saveWhitelist(whitelist);

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🔐 [ REGISTRY_UPDATED ]")
                .setDescription(`### **Immunity Granted**\n> **Target:** ${target.tag} (\`${target.id}\`)\n> **Status:** Whitelisted — Exempt from Anti-Nuke punishments.`)
                .setThumbnail(target.displayAvatarURL())
                .setFooter({ text: "interX • Security Matrix" })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // ───── REMOVE LOGIC ─────
        if (sub === "remove") {
            const targetId = message.mentions.users.first()?.id || args[1];
            if (!targetId || !/^\d{17,20}$/.test(targetId)) return message.reply("❌ **[ ERROR ]** Specify a valid user/bot mention or ID.");

            if (!ids.includes(targetId)) return message.reply("ℹ️ This ID is not in the security registry.");

            ids = ids.filter(id => id !== targetId);
            whitelist[guildId] = ids;
            saveWhitelist(whitelist);

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("📉 [ REGISTRY_MODIFIED ]")
                .setDescription(`### **Immunity Revoked**\n> **ID:** \`${targetId}\`\n> **Status:** De-listed — Subject to standard security monitoring.`)
                .setFooter({ text: "interX • Security Matrix" })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // ───── LIST LOGIC ─────
        if (sub === "list") {
            if (ids.length === 0) return message.reply("🚫 **[ REGISTRY_EMPTY ]** No users or bots whitelisted in this sector.");

            const listLines = await Promise.all(ids.map(async (id, i) => {
                const u = await message.client.users.fetch(id).catch(() => null);
                return `**${i + 1}.** ${u ? `${u.tag} (\`${id}\`)` : `\`${id}\``}`;
            }));

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("📜 [ SECURITY_WHITELIST_DATA ]")
                .setDescription(`### **Total Personnel:** \`${ids.length}\`\n\n${listLines.join("\n")}`)
                .setFooter({ text: `interX • Guild: ${message.guild.name}` })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }
    }
};
