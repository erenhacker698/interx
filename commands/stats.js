const os = require("os");
const { version: djsversion, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "stats",
    description: "Detailed Bot & System Statistics using Components V2",
    aliases: ["botstats", "systeminfo", "status"],

    async execute(message) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const container = V2.container([
            V2.section(
                [
                    "📊 SYSTEM DIAGNOSTICS",
                    `**Status:** 🟢 Online & Stable\n**Defense:** Maximum (Encrypted)\n\u200b`
                ],
                message.client.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
            ),
            "🚀 OPERATIONAL STATUS",
            `> **Uptime:** \`${uptimeString}\`\n> **Latency:** \`${message.client.ws.ping}ms\``,
            "🧠 RESOURCE ALLOCATION",
            `> **RAM Usage:** \`${memoryUsage} MB\` / \`${totalMemory} GB\`\n> **Platform:** \`${os.platform().toUpperCase()} (${os.arch()})\``,
            "🧩 BOT INTELLIGENCE",
            `> **Guilds:** \`${message.client.guilds.cache.size}\`\n> **Users:** \`${message.client.users.cache.size}\`\n> **Discord.js:** \`v${djsversion}\``
        ], "#ff0000ff");

        message.reply({
            content: null,
            components: [container]
        });
    }
};
