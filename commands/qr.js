const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/quarantine.json");

function saveRoles(guildId, userId, roles) {
    let data = {};
    if (fs.existsSync(DB_PATH)) { try { data = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { } }
    if (!data[guildId]) data[guildId] = {};
    data[guildId][userId] = roles;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

async function quarantineMember(guild, target, reason, enforcer) {
    let qrRole = guild.roles.cache.find(r => r.name.toLowerCase() === "quarantined");
    if (!qrRole) {
        try {
            qrRole = await guild.roles.create({ name: "Quarantined", color: "#FF0000", permissions: [], reason: "Quarantine System Setup" });
        } catch (e) {
            return { success: false, error: "Failed to create Quarantined role." };
        }
    }

    let qrChannel = guild.channels.cache.find(c => c.name === "quarantine-zone");
    if (!qrChannel) {
        try {
            qrChannel = await guild.channels.create({
                name: "quarantine-zone",
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: qrRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                ]
            });
        } catch (e) { console.error("Failed to create QR channel:", e); }
    }

    guild.channels.cache.forEach(async (channel) => {
        if (channel.name === "quarantine-zone") return;
        if (!channel.permissionOverwrites.cache.get(qrRole.id)) {
            try {
                await channel.permissionOverwrites.create(qrRole, {
                    SendMessages: false, SendMessagesInThreads: false, CreatePublicThreads: false,
                    CreatePrivateThreads: false, AddReactions: false, Connect: false,
                    Speak: false, Stream: false, UseApplicationCommands: false, RequestToSpeak: false
                }, { reason: "Quarantine Lockdown" });
            } catch (e) { }
        }
    });

    try {
        const currentRoleIds = target.roles.cache.map(r => r.id);
        saveRoles(guild.id, target.id, currentRoleIds);
        await target.roles.set([qrRole.id], `Quarantined by ${enforcer.tag}: ${reason}`);

        if (qrChannel) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("☣️ SUBJECT QUARANTINED")
                .setDescription(`${target}, you have been placed in isolation.\n\n> **Reason:** ${reason}\n> **Enforced by:** ${enforcer.tag}`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: "interX • Quarantine Protocol" })
                .setTimestamp();
            qrChannel.send({ embeds: [embed] });
        }
        return { success: true, channel: qrChannel };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

module.exports = {
    name: "qr",
    description: "Quarantine a user (Admin/Owner Only)",
    aliases: ["quarantine"],
    usage: "!qr @user [reason] | !qr setup | !qr delete",
    permissions: [PermissionsBitField.Flags.ModerateMembers],
    quarantineMember,

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("🚫 **Access Denied.** Administrator permission required.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const sub = args[0]?.toLowerCase();

        if (sub === "setup") {
            let qrRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "quarantined");
            let qrChannel = message.guild.channels.cache.find(c => c.name === "quarantine-zone");
            const created = [];

            if (!qrRole) {
                try {
                    qrRole = await message.guild.roles.create({ name: "Quarantined", color: "#FF0000", permissions: [], reason: "Quarantine Setup" });
                    created.push("`@Quarantined` role");
                } catch (e) {
                    return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ Failed to create Quarantined role.").setFooter({ text: "interX • Error" }).setTimestamp()] });
                }
            }

            if (!qrChannel) {
                try {
                    qrChannel = await message.guild.channels.create({
                        name: "quarantine-zone", type: ChannelType.GuildText,
                        permissionOverwrites: [
                            { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: qrRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                        ]
                    });
                    created.push("`#quarantine-zone` channel");
                } catch (e) {
                    return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ Failed to create quarantine channel.").setFooter({ text: "interX • Error" }).setTimestamp()] });
                }
            }

            if (qrRole) {
                message.guild.channels.cache.forEach(async (ch) => {
                    if (ch.name === "quarantine-zone") return;
                    try { await ch.permissionOverwrites.create(qrRole, { SendMessages: false, AddReactions: false, Connect: false, Speak: false }, { reason: "Quarantine Setup Lockdown" }); } catch (e) { }
                });
            }

            const statusText = created.length > 0
                ? `**Created:**\n${created.map(c => `> ✅ ${c}`).join("\n")}\n\nChannel lockdowns applied.`
                : `> ✅ **Role** and **Channel** already exist.\n> Lockdowns re-applied.`;

            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("☣️ QUARANTINE SETUP").setDescription(statusText).setFooter({ text: "interX • Quarantine Protocol" }).setTimestamp()] });
        }

        if (sub === "delete") {
            try {
                const qrRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === "quarantined");
                const qrChannel = message.guild.channels.cache.find(c => c.name === "quarantine-zone");
                const deleted = [];
                if (qrChannel) { await qrChannel.delete(); deleted.push("`#quarantine-zone`"); }
                if (qrRole) { await qrRole.delete(); deleted.push("`@Quarantined`"); }
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("☣️ QUARANTINE DISMANTLED").setDescription(deleted.length > 0 ? `Removed: ${deleted.join(", ")}` : "Nothing to delete.").setFooter({ text: "interX • Quarantine Protocol" }).setTimestamp()] });
            } catch (e) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription(`❌ Failed to dismantle: ${e.message}`).setFooter({ text: "interX • Error" }).setTimestamp()] });
            }
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("☣️ QUARANTINE SYSTEM").setDescription("**Usage:**\n> `!qr @user [reason]` — Isolate a member\n> `!qr setup` — Initialize the quarantine system\n> `!qr delete` — Dismantle the quarantine system\n> `!uq @user` — Release from quarantine").setFooter({ text: "interX • Quarantine Protocol" }).setTimestamp()] });
        }

        if ((target.id === BOT_OWNER_ID) || target.id === message.guild.ownerId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle("⚠️ PATHETIC ATTEMPT DETECTED").setDescription(`Did you seriously just try to quarantine ${(target.id === BOT_OWNER_ID) ? "a **System Architect**" : "the **Server Owner**"}?\n\n> You have no power here, ${message.author}. Know your place.`).setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 512 })).setFooter({ text: "interX • Sovereign Protection" }).setTimestamp()] });
        }

        if (!isBotOwner && !isServerOwner && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ Cannot quarantine a user with equal or higher role.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const reason = args.slice(1).join(" ") || "No reason provided";
        const result = await quarantineMember(message.guild, target, reason, message.author);

        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor(0x8B0000)
                .setTitle("☣️ SUBJECT QUARANTINED")
                .setDescription(`**${target.user.tag}** has been moved to isolation.\nAll previous roles have been stripped and saved.`)
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: "📝 Reason", value: reason, inline: true },
                    { name: "👮 Enforcer", value: message.author.tag, inline: true },
                    { name: "📍 Zone", value: `${result.channel || "quarantine-zone"}`, inline: true }
                )
                .setFooter({ text: "interX • Quarantine Protocol Active" })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } else {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription(`❌ **Quarantine Failed:** ${result.error}`).setFooter({ text: "interX • Error" }).setTimestamp()] });
        }
    }
};
