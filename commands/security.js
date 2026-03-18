const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "security",
    description: "Live V2 Security Telemetry & System Control",
    aliases: ["sec", "dashboard"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && message.author.id !== message.guild.ownerId) return;

        const clientUser = message.client.user;
        const guild = message.guild;

        // 📊 DATA RETRIEVAL
        const ANTINUKE_DB = path.join(__dirname, "../data/antinuke.json");
        const ANTIRAID_DB = path.join(__dirname, "../data/antiraid.json");
        const AUTOMOD_DB = path.join(__dirname, "../data/automod.json");

        const load = (p, def) => {
            if (!fs.existsSync(p)) return def;
            try { return JSON.parse(fs.readFileSync(p, "utf8"))[guild.id] || def; } catch (e) { return def; }
        };

        const anConfig = load(ANTINUKE_DB, { enabled: false });
        const arConfig = load(ANTIRAID_DB, { enabled: false });
        const amConfig = load(AUTOMOD_DB, { antiLinks: true, antiSpam: true, antiBadWords: true });

        // Hierarchy Check
        const me = guild.members.me;
        const botRole = me.roles.botRole;
        const isApex = botRole && botRole.position >= guild.roles.cache.size - 2;

        const dashboardContainer = V2.container([
            V2.section([
                "📡 SOVEREIGN CORE TELEMETRY",
                `**Node:** ${guild.name}\n**System Status:** ${isApex ? "🟢 ABSOLUTE_APEX" : "🔴 DEGRADED_HIERARCHY"}`
            ], message.client.user.displayAvatarURL()),
            "🛡️ LAYER STATUS",
            V2.text(
                `> **Anti-Nuke:** ${anConfig.enabled ? "✅ ACTIVE" : "❌ OFFLINE"}\n` +
                `> **Anti-Raid:** ${arConfig.enabled ? "✅ ACTIVE" : "❌ OFFLINE"}\n` +
                `> **Ghost-Watch:** 🛡️ **INSTANT_TERMINATION**\n` +
                `> **Apex-Lock:** ${isApex ? "🔱 AT_TOP" : "⚠️ BELOW_PEERS"}`
            ),
            "⚙️ AUTOMOD MODULES",
            V2.text(
                `> **Spam Filter:** ${amConfig.antiSpam ? "✅" : "❌"}\n` +
                `> **Link Shield:** ${amConfig.antiLinks ? "✅" : "❌"}\n` +
                `> **Profanity Filter:** ${amConfig.antiBadWords ? "✅" : "❌"}`
            ),
            "📋 COMMAND INDEX",
            `\`!sa\` (Apex) • \`!antinuke\` • \`!antiraid\` • \`!automod\``,

            `*Last Heartbeat: ${new Date().toLocaleTimeString()} • Node Jurisidction: ${message.client.user.username}*`
        ]);

        return message.reply({ content: null, components: [dashboardContainer] });
    }
};
