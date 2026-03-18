const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const BASELINE_PATH = path.join(__dirname, "../data/baseline.json");

module.exports = {
    name: "createbaseline",
    description: "Create a security snapshot of the server (Owner Only)",
    aliases: ["baseline", "snap"],

    async execute(message) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const guild = message.guild;
        const data = {
            timestamp: Date.now(),
            guildId: guild.id,
            author: message.author.id,
            stats: { channels: guild.channels.cache.size, roles: guild.roles.cache.size, members: guild.memberCount },
            channels: guild.channels.cache.map(c => ({
                id: c.id, name: c.name, type: c.type, parentId: c.parentId,
                permissionOverwrites: c.permissionOverwrites ? c.permissionOverwrites.cache.map(p => ({ id: p.id, allow: p.allow.bitfield.toString(), deny: p.deny.bitfield.toString() })) : []
            })),
            roles: guild.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor, hoist: r.hoist, permissions: r.permissions.bitfield.toString() }))
        };

        fs.writeFileSync(BASELINE_PATH, JSON.stringify(data, null, 2));

        await message.channel.send({
            components: [V2.container([
                V2.section([
                    "🔒 SECURITY BASELINE ESTABLISHED",
                    V2.text(
                        `**Snapshot secured.** A complete index of server permissions, roles, and channels has been saved.\n\n` +
                        `> 📁 **Channels:** \`${data.stats.channels}\`\n` +
                        `> 🎭 **Roles:** \`${data.stats.roles}\`\n` +
                        `> 👥 **Members:** \`${data.stats.members}\`\n` +
                        `> ⏱️ **Snapshot At:** <t:${Math.floor(data.timestamp / 1000)}:f>`
                    )
                ], guild.iconURL({ dynamic: true }) || message.client.user.displayAvatarURL()),
                "*interX • Recovery System*"
            ])]
        });
    }
};
