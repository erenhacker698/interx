const os = require("os");
const { version: djsversion } = require("discord.js");

module.exports = {
    name: "stats",
    description: "Detailed Bot & System Statistics using Components V2",
    aliases: ["botstats", "systeminfo", "status"],

    async execute(message) {
        try {
            const botUptime = process.uptime();
            const days = Math.floor(botUptime / 86400);
            const hours = Math.floor((botUptime % 86400) / 3600);
            const minutes = Math.floor((botUptime % 3600) / 60);
            const seconds = Math.floor(botUptime % 60);
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            
            const totalUsers = message.client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
            const totalChannels = message.client.channels.cache.size || 0;

            // Safe CPU Access
            const cpus = os.cpus();
            const cpuModel = cpus && cpus.length > 0 ? cpus[0].model.replace("(R)", "").trim() : "System Processor";

            const container = V2.container([
                V2.section(
                    [
                        "📊 SYSTEM DIAGNOSTICS: CORE_V3",
                        `**Status:** 🟢 Operational (Node: \`${process.version}\`)\n**Sovereign Shield:** ACTIVATED\n**Protocol:** Elite v3.0 Standard`
                    ],
                    V2.botAvatar(message)
                ),
                V2.separator(),
                "🚀 OPERATIONAL METRICS",
                `> • **Uptime:** \`${uptimeString}\`\n> • **API Latency:** \`${message.client.ws.ping}ms\`\n> • **Shard Status:** \`Stable\``,
                "🧠 RESOURCE ALLOCATION",
                `> • **CPU:** \`${cpuModel}\`\n` +
                `> • **Memory Usage:** \`${usedMem} MB\` / \`${totalMem} GB\`\n` +
                `> • **OS Platform:** \`${os.platform().toUpperCase()} (${os.arch()})\``,
                "🧩 BOT INFRASTRUCTURE",
                `> • **Guilds:** \`${message.client.guilds.cache.size}\`\n` +
                `> • **Channels:** \`${totalChannels.toLocaleString()}\`\n` +
                `> • **Users Protected:** \`${totalUsers.toLocaleString()}\``,
                "📁 VERSION CONTROL",
                `> • **Discord.js:** \`v${djsversion}\`\n` +
                `> • **System Core:** \`v3.0 Sovereign\``
            ], "#df0000"); 

            return message.reply({
                content: null,
                components: [container]
            });
        } catch (err) {
            console.error("[Stats Error]:", err);
            return message.reply("❌ **CRITICAL ERROR:** Diagnostic sequence failed to initialize. Consult the Architect.");
        }
    }
};


