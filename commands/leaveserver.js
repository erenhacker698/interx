const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "leaveserver",
    description: "Make the bot leave the current server (Bot Owner only).",
    aliases: ["lv", "leave"],
    async execute(message) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;
        await message.reply({
            components: [V2.container([`👋 **Departing from ${message.guild.name}...**\n> Node de-registered. Connection severed.`])]
        });
        await message.guild.leave();
    }
};
