const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/quarantine.json");

function getSavedRoles(guildId, userId) {
    if (!fs.existsSync(DB_PATH)) return [];
    try { const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); return data[guildId]?.[userId] || []; } catch { return []; }
}

module.exports = {
    name: "uq",
    description: "Unquarantine a user — restores all saved roles (Admin/Owner Only)",
    aliases: ["unquarantine"],
    usage: "!uq @user",
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args) {
        const isOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID)) || message.guild.ownerId === message.author.id;
        if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("🚫 **ACCESS DENIED** | Authorized Personnel Only.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("⚠️ **User not found.**\nUsage: `!uq @user`").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try { await target.fetch(); } catch (e) { }

        const qrRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "quarantined");
        if (!qrRole) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("⚠️ **Quarantine system not active** — `Quarantined` role not found.\nRun `!qr setup` first.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (qrRole.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ **Hierarchy Error:** `Quarantined` role is above my highest role. Reposition it.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (!target.roles.cache.has(qrRole.id)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription(`⚠️ **${target.user.tag}** is not currently quarantined.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try {
            await target.roles.remove(qrRole, `Unquarantined by ${message.author.tag}`);

            const savedRoleIds = getSavedRoles(message.guild.id, target.id);
            let restoredCount = 0;
            if (savedRoleIds.length > 0) {
                const rolesToRestore = savedRoleIds.filter(id => {
                    const r = message.guild.roles.cache.get(id);
                    return r && r.editable && r.id !== message.guild.id;
                });
                if (rolesToRestore.length > 0) {
                    await target.roles.add(rolesToRestore, "Quarantine: Restoring roles").catch(() => { });
                    restoredCount = rolesToRestore.length;
                }
            }

            if (fs.existsSync(DB_PATH)) {
                try {
                    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
                    if (data[message.guild.id]?.[target.id]) {
                        delete data[message.guild.id][target.id];
                        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
                    }
                } catch (e) { }
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF0033)
                .setTitle("✅ SUBJECT RELEASED")
                .setDescription(`**${target.user.tag}** has been freed from isolation.\nAll previous roles have been restored.`)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: "🔁 Roles Restored", value: `\`${restoredCount}\``, inline: true },
                    { name: "👮 Released by", value: message.author.tag, inline: true },
                    { name: "🕐 At", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                )
                .setFooter({ text: "interX • Quarantine Protocol" })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (e) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription(`❌ **Failed to unquarantine:** ${e.message}`).setFooter({ text: "interX • Error" }).setTimestamp()] });
        }
    }
};
