const { EmbedBuilder } = require("discord.js");
const os = require("os");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "botinfo",
    description: "Display interX core intelligence and system status.",
    aliases: ["bi", "about", "binfo"],

    async execute(message) {
        const { client } = message;
        const botUser = client.user;

        // ── NETWORK STATS ──
        const guilds = client.guilds.cache.size;
        const users = client.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0);
        const channels = client.channels.cache.size;
        const commands = client.commands.size;

        // ── SYSTEM STATS ──
        const uptime = formatUptime(client.uptime);
        const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const memTotal = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);

        const cpu = os.cpus()[0]?.model.split(" ").slice(0, 3).join(" ") || "Virtual Node";
        const ping = client.ws.ping;
        const pingIndicator = ping < 150 ? "🟢" : ping < 300 ? "🟡" : "🔴";

        // ── IDENTITY ──
        const avatar = message.client.user.displayAvatarURL();

        // ── CONSTRUCT interX DASHBOARD ──
        try {
            const dashboard = V2.container([
                V2.section([
                    "interX: SOVEREIGN NODE",
                    `**Intelligence Feed v3.0**\n> **Architect:** <@${BOT_OWNER_ID}>\n> **Node ID:** \`${botUser.id}\``
                ], avatar),
                "NETWORK ANALYTICS",
                V2.text(
                    `> 🏛️ **Total Nodes:** \`${guilds}\`\n` +
                    `> 👥 **Entities:** \`${users.toLocaleString()}\`\n` +
                    `> ⚙️ **Indexed Logic:** \`${commands}\` Modules`
                ),
                "HEARTBEAT & CORE",
                V2.text(
                    `> ${pingIndicator} **Sync Latency:** \`${ping}ms\`\n` +
                    `> 🧠 **Memory Heap:** \`${memUsed} MB / ${memTotal} MB\``
                ),
                `*Security Integrity: VERIFIED • interX © 2026 Sovereign Systems*`
            ]);

            return message.reply({
                content: null,
                components: [dashboard]
            });

        } catch (error) {
            console.error("[BotInfo Error]:", error);
            const { EmbedBuilder } = require("discord.js");
            const fallback = new EmbedBuilder()
                .setColor(V2_RED || "#ff2e2e")
                .setTitle("🛡️ interX Intelligence (Recovery Mode)")
                .setDescription(`Sovereign Interface encountered a fault.\n\n**Uptime:** ${uptime}\n**Latency:** ${ping}ms\n**Servers:** ${guilds}`)
                .setFooter({ text: "interX • Sovereign Systems" });

            return message.reply({ embeds: [fallback] });
        }
    }
};

function formatUptime(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
