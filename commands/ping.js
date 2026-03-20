const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "ping",
  description: "Check the bot's latency and system status",
  aliases: ["p", "latency"],

  async execute(message) {
    const startTime = Date.now();
    const apiPing = Math.round(message.client.ws.ping);

    // Initial response to start measurement
    const msg = await message.reply({
      content: null,
      components: [
        V2.container([
          `🛰️ **Calculating Ultra-Precision Latency...**`
        ])
      ]
    });

    const roundTrip = Date.now() - startTime;
    const botPing = roundTrip - apiPing; 
    
    // Smooth coloring
    const status = apiPing < 50 ? "🟢 EXCELLENT" : apiPing < 150 ? "🟡 STABLE" : "🔴 DEGRADED";

    msg.edit({
      components: [
        V2.container([
          V2.section([
            V2.heading("System Diagnostic: Latency Report", 3),
            `> **API Latency:** \`${apiPing}ms\`\n` +
            `> **Bot Response:** \`${roundTrip}ms\`\n` +
            `> **Node Process:** \`${botPing < 0 ? 0 : botPing}ms\`\n\n` +
            `**Status:** ${status}`
          ])
        ])
      ]
    });
  }
};
