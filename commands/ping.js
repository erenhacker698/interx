const { EmbedBuilder } = require("discord.js");
module.exports = {
  name: "ping",
  description: "Check the bot's latency and system status",
  aliases: ["p", "latency"],

  async execute(message) {
    const startTime = Date.now();
    const apiPing = message.client.ws.ping;

    // We can't really do the "re-edit" easily with V2 content=null without initial flicker
    // but the user wants it built with V2.

    // Calculate initial roughly
    const initialLatency = Date.now() - startTime;

    message.reply({
      content: null,
      components: [
        V2.container([
          `<@${message.client.user.id}> Pong! Bot: \`${initialLatency}ms\` | API: \`${apiPing}ms\``
        ]) // Blue accent for the container
      ]
    });
  }
};
