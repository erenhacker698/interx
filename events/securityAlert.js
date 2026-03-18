const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = (client) => {

    // 🔍 Check function
    function checkPerms(guild) {
        const me = guild.members.me;
        if (!me) return;

        const hasAdmin = me.permissions.has(PermissionsBitField.Flags.Administrator);

        if (hasAdmin) return; // all good

        // 🔴 Send alert in system channel OR first text channel
        const channel =
            guild.systemChannel ||
            guild.channels.cache.find(c =>
                c.isTextBased() &&
                c.viewable &&
                c.permissionsFor(me).has("SendMessages")
            );

        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🛡️ SECURITY ALERT")
            .setDescription(`Bot joined **${guild.name}**`)
            .addFields(
                { name: "⚠️ Status", value: "Administrator permission **NOT detected**" },
                { name: "🛑 Mode", value: "Restricted Mode Enabled" },
                { name: "🚨 Risk", value: "Anti-Nuke / Protection may fail" },
                { name: "📌 Fix", value: "Grant **Administrator** permission to the bot" }
            )
            .setFooter({ text: "Security System • Immediate Action Required" })
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    }

    // 🚀 When bot joins a server
    client.on("guildCreate", (guild) => {
        checkPerms(guild);
    });

    // 🔁 When bot starts (check all servers)
    client.on("ready", () => {
        client.guilds.cache.forEach(guild => {
            checkPerms(guild);
        });
    });

};