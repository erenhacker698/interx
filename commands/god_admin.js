const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "god_admin",
    description: "God Mode Administrative Commands",
    aliases: ["eannoc", "edelnuke"],

    async execute(message, args, commandName) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        // EANNOC: Global Announcement
        if (commandName === "eannoc") {
            const announcement = args.join(" ");
            if (!announcement) return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ Provide a message to broadcast globally.").setFooter({ text: "interX • Security" }).setTimestamp()] });

            await message.reply(`📢 **Broadcasting Global Announcement...**`);

            let sentCount = 0;
            const broadcastContainer = V2.container([
                V2.section([
                    "📢 GLOBAL SYSTEM ANNOUNCEMENT",
                    `### **[ INCOMING_COMMUNICATION ]**\n\n${announcement}`
                ], message.client.user.displayAvatarURL()),
                "*interX • Global Intelligence Network*"
            ]);

            // Iterate over all cached guilds
            const guilds = message.client.guilds.cache;
            for (const [_, guild] of guilds) {
                const channel = guild.channels.cache.find(c =>
                    c.type === ChannelType.GuildText &&
                    c.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)
                );

                if (channel) {
                    try {
                        await channel.send({ content: null, components: [broadcastContainer] });
                        sentCount++;
                    } catch (e) { }
                }
            }

            const successContainer = V2.container([
                V2.section([
                    "✅ BROADCAST COMPLETE",
                    `The message has been successfully transmitted to **${sentCount}** server nodes.`
                ], message.client.user.displayAvatarURL())
            ]);

            return message.channel.send({ content: null, components: [successContainer] });
        }

        // EDELNUKE: Delete All Channels (with confirmation)
        if (commandName === "edelnuke") {
            if (message.content.includes("--confirm")) {
                const channels = message.guild.channels.cache;
                const nukeMsg = V2.container([
                    V2.section([
                        "🧨 INITIATING TOTAL WIPEOUT",
                        `**Target:** all **${channels.size}** channels in this node.\n**Status:** Execution in progress...`
                    ], message.client.user.displayAvatarURL())
                ]);

                await message.reply({ content: null, components: [nukeMsg] });
                channels.forEach(c => c.delete().catch(() => { }));
            } else {
                const lockContainer = V2.container([
                    V2.section([
                        "⚠️ SOVEREIGN SAFETY LOCK",
                        "You are attempting a restricted destructive protocol."
                    ], message.client.user.displayAvatarURL()),
                    V2.field("📜 PROTOCOL", "Run `!edelnuke --confirm` to authorize channel annihilation."),
                    "*interX • Security Safeguard*"
                ]);

                return message.reply({ content: null, components: [lockContainer] });
            }
        }
    }
};
