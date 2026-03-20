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
    const botPingRaw = roundTrip - apiPing;
    const botPingValidated = isNaN(botPingRaw) ? 0 : botPingRaw; 
    
    // Smooth coloring
    const status = apiPing < 50 ? "🟢 EXCELLENT" : apiPing < 150 ? "🟡 STABLE" : "🔴 DEGRADED";

    // Wait 500ms to ensure the first message is fully processed by the client
    setTimeout(async () => {
      // Explicitly wrap the message object just in case the global patch didn't catch it
      const wrappedMsg = V2.wrapSentMessage(msg);
      
      wrappedMsg.edit({
        components: [
          V2.container([
            V2.section([
              V2.heading("System Diagnostic: Latency Report", 3),
              `> **API Latency:** \`${apiPing || 0}ms\`\n` +
              `> **Bot Response:** \`${roundTrip}ms\`\n` +
              `> **Node Process:** \`${botPingValidated < 0 ? 0 : botPingValidated}ms\`\n\n` +
              `**Status:** ${status}`
            ])
          ])
        ]
      }).catch(e => console.error("EditError:", e));
    }, 500);
  }
};
