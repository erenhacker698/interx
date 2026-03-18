const { AuditLogEvent, EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = (client) => {

const LOG_CHANNEL_ID = "PASTE_CHANNEL_ID";

// track actions
const deleteTracker = new Map();

function log(guild, embed) {
    const ch = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (ch) ch.send({ embeds: [embed] }).catch(() => {});
}

// 💣 CHANNEL DELETE DETECT
client.on("channelDelete", async (channel) => {

    const guild = channel.guild;

    const audit = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
    });

    const entry = audit.entries.first();
    if (!entry) return;

    const user = entry.executor;
    if (!user || user.bot) return;

    // whitelist (optional)
    if (user.id === guild.ownerId) return;

    const now = Date.now();
    const data = deleteTracker.get(user.id) || { count: 0, time: now };

    // reset if time passed
    if (now - data.time > 5000) {
        data.count = 0;
        data.time = now;
    }

    data.count++;
    deleteTracker.set(user.id, data);

    // 💀 TRIGGER TRAP
    if (data.count >= 2) {

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        // 🔥 punish
        await member.ban({ reason: "Nuke attempt detected" }).catch(() => {});

        // 🚨 ALERT
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("💣 NUKE TRAP ACTIVATED")
            .setDescription(`User **${user.tag}** has been banned`)
            .addFields(
                { name: "Reason", value: "Mass channel deletion detected" },
                { name: "Action", value: "Auto Ban Executed" }
            )
            .setTimestamp();

        log(guild, embed);

        deleteTracker.delete(user.id);
    }
});

};