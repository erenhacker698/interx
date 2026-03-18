const { EmbedBuilder, AuditLogEvent } = require("discord.js");

module.exports = (client) => {

    // Read log channel from config.json automatically
    const config = require("./config.json");
    const LOG_CHANNEL_ID = config.logChannelId || config.logChannel;

    // send log to guild's log channel
    function log(guild, embed) {
        const ch = guild.channels.cache.get(LOG_CHANNEL_ID);
        if (ch) ch.send({ embeds: [embed] }).catch(() => { });
    }

    // format time as Discord timestamp
    function time() {
        return `<t:${Math.floor(Date.now() / 1000)}:F>`;
    }

    // ================= 🗑️ MESSAGE DELETE =================
    client.on("messageDelete", async (msg) => {
        if (!msg.guild || msg.author?.bot) return;

        let executor = "Unknown";

        try {
            const audit = await msg.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1
            });
            const entry = audit.entries.first();
            if (entry) executor = `${entry.executor.tag} (${entry.executor.id})`;
        } catch { }

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🗑️ Message Deleted")
            .addFields(
                { name: "User", value: `${msg.author.tag} (${msg.author.id})` },
                { name: "Deleted By", value: executor },
                { name: "Channel", value: `${msg.channel}` },
                { name: "Content", value: (msg.content || "No text").slice(0, 1024) },
                { name: "Time", value: time() }
            );

        if (msg.attachments.size > 0) {
            embed.addFields({ name: "Attachments", value: msg.attachments.map(a => a.url).join("\n").slice(0, 1024) });
        }

        log(msg.guild, embed);
    });

    // ================= ✏️ MESSAGE EDIT =================
    client.on("messageUpdate", (oldMsg, newMsg) => {
        if (!oldMsg.guild || oldMsg.author?.bot) return;
        if (oldMsg.content === newMsg.content) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("✏️ Message Edited")
            .addFields(
                { name: "User", value: `${oldMsg.author.tag} (${oldMsg.author.id})` },
                { name: "Before", value: (oldMsg.content || "None").slice(0, 1024) },
                { name: "After", value: (newMsg.content || "None").slice(0, 1024) },
                { name: "Time", value: time() }
            );

        log(oldMsg.guild, embed);
    });

    // ================= 👤 MEMBER JOIN =================
    client.on("guildMemberAdd", (member) => {
        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("➕ Member Joined")
            .setDescription(`${member.user.tag} (${member.id})`)
            .addFields({ name: "Time", value: time() });

        log(member.guild, embed);
    });

    // ================= ➖ MEMBER LEAVE =================
    client.on("guildMemberRemove", (member) => {
        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("➖ Member Left")
            .setDescription(`${member.user.tag} (${member.id})`)
            .addFields({ name: "Time", value: time() });

        log(member.guild, embed);
    });

    // ================= 👤 ROLE UPDATE (member) =================
    client.on("guildMemberUpdate", (oldM, newM) => {
        const oldRoles = oldM.roles.cache.map(r => r.id);
        const newRoles = newM.roles.cache.map(r => r.id);

        const added = newRoles.filter(r => !oldRoles.includes(r));
        const removed = oldRoles.filter(r => !newRoles.includes(r));

        if (!added.length && !removed.length) return;

        const embed = new EmbedBuilder()
            .setColor("#ec0c0cff")
            .setTitle("👤 Role Update")
            .setDescription(`${newM.user.tag} (${newM.id})`)
            .addFields(
                { name: "Added", value: added.map(id => `<@&${id}>`).join(", ") || "None" },
                { name: "Removed", value: removed.map(id => `<@&${id}>`).join(", ") || "None" },
                { name: "Time", value: time() }
            );

        log(newM.guild, embed);
    });

    // ================= 📁 CHANNEL CREATE =================
    client.on("channelCreate", (ch) => {
        const embed = new EmbedBuilder()
            .setColor("#ff0000ff")
            .setTitle("📁 Channel Created")
            .setDescription(`${ch.name} (${ch.id})`)
            .addFields({ name: "Time", value: time() });

        log(ch.guild, embed);
    });

    // ================= 💣 CHANNEL DELETE =================
    client.on("channelDelete", async (ch) => {
        let executor = "Unknown";
        try {
            const audit = await ch.guild.fetchAuditLogs({
                type: AuditLogEvent.ChannelDelete,
                limit: 1
            });
            const entry = audit.entries.first();
            if (entry) executor = `${entry.executor.tag} (${entry.executor.id})`;
        } catch { }

        const embed = new EmbedBuilder()
            .setColor("#ff0101")
            .setTitle("💣 Channel Deleted")
            .addFields(
                { name: "Channel", value: `${ch.name} (${ch.id})` },
                { name: "Deleted By", value: executor },
                { name: "Time", value: time() }
            );

        log(ch.guild, embed);
    });

    // ================= 🧨 ROLE DELETE =================
    client.on("roleDelete", async (role) => {
        let executor = "Unknown";
        try {
            const audit = await role.guild.fetchAuditLogs({
                type: AuditLogEvent.RoleDelete,
                limit: 1
            });
            const entry = audit.entries.first();
            if (entry) executor = `${entry.executor.tag} (${entry.executor.id})`;
        } catch { }

        const embed = new EmbedBuilder()
            .setColor("#ff1010ff")
            .setTitle("🧨 Role Deleted")
            .addFields(
                { name: "Role", value: `${role.name} (${role.id})` },
                { name: "Deleted By", value: executor },
                { name: "Time", value: time() }
            );

        log(role.guild, embed);
    });

    // ================= 🔒 ROLE CREATE =================
    client.on("roleCreate", (role) => {
        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🔒 Role Created")
            .setDescription(`${role.name} (${role.id})`)
            .addFields({ name: "Time", value: time() });

        log(role.guild, embed);
    });

    // ================= 🎤 VOICE ACTIVITY =================
    client.on("voiceStateUpdate", (oldS, newS) => {
        if (!newS.member) return;
        const user = newS.member.user;

        let action = null;

        if (!oldS.channel && newS.channel) {
            action = `🔊 Joined ${newS.channel}`;
        } else if (oldS.channel && !newS.channel) {
            action = `🔇 Left ${oldS.channel}`;
        } else if (oldS.channel !== newS.channel) {
            action = `🔁 Moved to ${newS.channel}`;
        }

        if (!action) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🎤 Voice Activity")
            .setDescription(`${user.tag} (${user.id})\n${action}`)
            .addFields({ name: "Time", value: time() });

        log(newS.guild, embed);
    });

    // ================= 🚨 ANTI-NUKE DETECT =================
    client.on("channelDelete", async (ch) => {
        const audit = await ch.guild.fetchAuditLogs({
            type: AuditLogEvent.ChannelDelete,
            limit: 1
        });

        const entry = audit.entries.first();
        if (!entry) return;

        const executor = entry.executor;

        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🚨 POSSIBLE NUKE DETECTED")
            .setDescription(`User: ${executor.tag} (${executor.id})`)
            .addFields({ name: "Action", value: "Channel Delete Spam?" });

        log(ch.guild, embed);
    });

};