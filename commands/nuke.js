const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "nuke",
    description: "Nuke the current channel (Delete & Recreate)",
    usage: "!nuke",
    permissions: [PermissionsBitField.Flags.Administrator],
    whitelistOnly: true,

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        // Permission Check (Owner Bypass)
        if (!isBotOwner && !isServerOwner && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 MISSING PERMISSIONS").setDescription("I do not have permission to manage channels.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const channel = message.channel;

        // Safety check: Don't nuke important channels if possible? 
        // For now, we trust the user.

        try {
            // Confirm Clone
            const originalPosition = channel.position;

            // Clone the channel
            const newChannel = await channel.clone({
                position: originalPosition
            });

            // ♻️ SMART UPDATE: Check if this was a log channel and update DB
            const fs = require("fs");
            const path = require("path");
            const LOGS_DB = path.join(__dirname, "../data/logs.json");

            if (fs.existsSync(LOGS_DB)) {
                try {
                    let data = JSON.parse(fs.readFileSync(LOGS_DB, "utf8"));
                    let guildData = data[message.guild.id];
                    let updated = false;

                    if (guildData) {
                        for (const [key, val] of Object.entries(guildData)) {
                            if (val === channel.id) {
                                guildData[key] = newChannel.id; // Update ID
                                updated = true;
                            }
                        }
                    }

                    if (updated) {
                        fs.writeFileSync(LOGS_DB, JSON.stringify(data, null, 2));
                    }
                } catch (e) {
                    console.error("Smart Nuke Fail:", e);
                }
            }

            // Delete the old channel
            try {
                await channel.delete(`Nuked by ${message.author.tag}`);
            } catch (e) {
                // If it's already deleted (10003), ignore it. 
                if (e.code !== 10003) throw e;
            }



        } catch (err) {
            console.error("Nuke Command Error:", err);
            // If the old channel still exists, try to reply
            try {
                const ch = await message.guild.channels.fetch(message.channel.id).catch(() => null);
                if (ch) {
                    await ch.send({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("❌ NUKE FAILED").setDescription("See details below.").setFooter({ text: "interX • Security" }).setTimestamp()] });
                }
            } catch (e) { }
        }
    }
};
