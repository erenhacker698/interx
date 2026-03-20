const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/bump_status.json");

module.exports = {
    name: "bump",
    description: "🚀 interX Sovereign Server Bump Engine",
    aliases: ["b", "up", "boost-server"],
    usage: "!bump",

    async execute(message, args) {
        const data = loadData();
        const guildId = message.guild.id;
        const now = Date.now();
        const cooldown = 2 * 60 * 60 * 1000; // 2 Hours

        const lastBump = data[guildId]?.lastBump || 0;
        const nextBump = lastBump + cooldown;

        if (now < nextBump) {
            const remaining = nextBump - now;
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            const waitEmbed = new EmbedBuilder()
                .setColor("#aa0000") // Deep Red
                .setTitle("⏳ ENGINE COOLING DOWN")
                .setDescription(`### **Protocol: RATE_LIMITED**\n> Next ignition available in: **${minutes}m ${seconds}s**\n> Available: <t:${Math.floor(nextBump / 1000)}:R>`)
                .setFooter({ text: "interX Sovereign • Boost Protocol" })
                .setTimestamp();

            return message.reply({ embeds: [waitEmbed] });
        }

        // 🚀 BUMP SUCCESSFUL
        data[guildId] = {
            lastBump: now,
            channelId: message.channel.id,
            user: message.author.tag,
            reminderSent: false
        };
        saveData(data);

        const bumpEmbed = new EmbedBuilder()
            .setColor("#df0000") // interX Red
            .setTitle("🚀 SOVEREIGN ENGINE IGNITED")
            .setDescription(`### **Protocol: SERVER_BUMP_COMPLETE**\n> **Injected By:** ${message.author}\n> **Power Level:** \`100%\`\n> **Status:** Server prioritized in interX Network.\n\n*The engine will cool down for 2 hours. A reminder will be dispatched when ready.*`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: "interX Sovereign • Boost Protocol" })
            .setTimestamp();

        return message.reply({ content: "**BOOSTING SECTOR...**", embeds: [bumpEmbed] });
    },

    // ───── INITIALIZE AUTO-REMINDER ─────
    init(client) {
        setInterval(async () => {
            const data = loadData();
            const now = Date.now();
            const cooldown = 2 * 60 * 60 * 1000;

            let changed = false;

            for (const [guildId, val] of Object.entries(data)) {
                if (val.reminderSent === false && (now >= (val.lastBump + cooldown))) {
                    try {
                        const channel = await client.channels.fetch(val.channelId).catch(() => null);
                        if (channel) {
                            const reminderEmbed = new EmbedBuilder()
                                .setColor("#00ff00") // Green for ready
                                .setTitle("💎 SERVER READY FOR BUMP")
                                .setDescription(`### **Protocol: ENGINE_COOLED**\n> The bump cooldown has expired.\n> Run \`!bump\` to prioritize the server again.`)
                                .setFooter({ text: "interX Sovereign • Ready Protocol" })
                                .setTimestamp();

                            await channel.send({ content: "📢 **READY TO BUMP** 📢", embeds: [reminderEmbed] });
                        }
                        val.reminderSent = true;
                        changed = true;
                    } catch (e) {
                        console.error("[Bump Reminder Error]:", e);
                    }
                }
            }

            if (changed) saveData(data);
        }, 30000); // Check every 30 seconds
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
