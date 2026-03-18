const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const os = require("os");

module.exports = {
    name: "god_system",
    description: "God Mode System Commands",
    aliases: ["eram", "estats", "eusers", "eexit"],

    async execute(message, args, commandName) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        // ERAM: System Resource Usage
        if (commandName === "eram") {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const usedMemGB = (usedMem / 1024 / 1024 / 1024).toFixed(2);
            const totalMemGB = (totalMem / 1024 / 1024 / 1024).toFixed(2);

            const percentage = Math.round((usedMem / totalMem) * 100);
            const progressBar = "▓".repeat(Math.round(percentage / 10)) + "░".repeat(10 - Math.round(percentage / 10));

            let cpu = os.cpus()[0].model;
            cpu = cpu.replace(/\(R\)/g, "").replace(/\(TM\)/g, "").replace("Core", "").replace("CPU", "").trim();

            const platform = os.platform() === "win32" ? "Windows" : os.platform();

            const ramContainer = V2.container([
                V2.section([
                    "🖥️ RESOURCE MONITOR: KERNEL",
                    `\`\`\`yml\nRAM :: ${progressBar} ${percentage}%\n      [${usedMemGB}GB / ${totalMemGB}GB]\n\nCPU :: ${cpu}\nOS  :: ${platform} ${os.release()}\nUP  :: ${(os.uptime() / 3600).toFixed(1)} Hours\n\`\`\``
                ], message.client.user.displayAvatarURL()),
                "*interX • System Integrity Protocol*"
            ]);

            return message.reply({ content: null, components: [ramContainer] });
        }

        // ESTATS: Bot Performance
        if (commandName === "estats") {
            const apiPing = message.client.ws.ping;
            const heap = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

            const statsContainer = V2.container([
                V2.section([
                    "📊 PERFORMANCE METRICS",
                    `**API Latency:** \`${apiPing}ms\`\n**Memory Heap:** \`${heap} MB\`\n**Uptime:** <t:${Math.floor((Date.now() - message.client.uptime) / 1000)}:R>`
                ], message.client.user.displayAvatarURL()),
                "*interX • Analytics Manifest*"
            ]);

            return message.reply({ content: null, components: [statsContainer] });
        }

        // EUSERS: User & Guild Stats
        if (commandName === "eusers") {
            const totalUsers = message.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const totalGuilds = message.client.guilds.cache.size;
            const totalChannels = message.client.channels.cache.size;

            const usersContainer = V2.container([
                V2.section([
                    "👥 GLOBAL NETWORK CENSUS",
                    `\`\`\`asciidoc\nUsers    :: ${totalUsers.toLocaleString()}\nServers  :: ${totalGuilds.toLocaleString()}\nChannels :: ${totalChannels.toLocaleString()}\n\`\`\``
                ], message.client.user.displayAvatarURL()),
                "*interX • Population Analysis*"
            ]);

            return message.reply({ content: null, components: [usersContainer] });
        }

        // EEXIT: Exit God Mode (Visual)
        if (commandName === "eexit") {
            const exitContainer = V2.container([
                V2.section([
                    "🔌 SESSION TERMINATED",
                    `\`\`\`diff\n- ROOT ACCESS: DISCONNECTED\n- SYSTEM: SECURE\n- PROTOCOL: STANDBY\n\`\`\``
                ], message.client.user.displayAvatarURL()),
                "*interX • Root Logout Protocol*"
            ], "#FF0000"); // Red for logout

            return message.reply({ content: null, components: [exitContainer] });
        }
    }
};
