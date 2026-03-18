const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {

    const LOG_CHANNEL_ID = "1483350537150660640";

    // 🗑️ DELETE
    client.on("messageDelete", async (message) => {
        if (!message.guild || message.author?.bot) return;

        const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🗑️ Message Deleted")
            .addFields(
                { name: "User", value: message.author.tag, inline: true },
                { name: "Channel", value: `${message.channel}`, inline: true },
                { name: "Content", value: message.content || "No text" }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    });

    // ✏️ EDIT
    client.on("messageUpdate", async (oldMsg, newMsg) => {
        if (!oldMsg.guild || oldMsg.author?.bot) return;
        if (oldMsg.content === newMsg.content) return;

        const logChannel = oldMsg.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("✏️ Message Edited")
            .addFields(
                { name: "User", value: oldMsg.author.tag, inline: true },
                { name: "Before", value: oldMsg.content || "None" },
                { name: "After", value: newMsg.content || "None" }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    });

    // 👤 ROLES
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        const logChannel = newMember.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const oldRoles = oldMember.roles.cache.map(r => r.id);
        const newRoles = newMember.roles.cache.map(r => r.id);

        const added = newRoles.filter(r => !oldRoles.includes(r));
        const removed = oldRoles.filter(r => !newRoles.includes(r));

        if (!added.length && !removed.length) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("👤 Role Update")
            .setDescription(newMember.user.tag)
            .addFields(
                { name: "Added", value: added.map(id => `<@&${id}>`).join(", ") || "None" },
                { name: "Removed", value: removed.map(id => `<@&${id}>`).join(", ") || "None" }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    });

    // 🎤 VOICE
    client.on("voiceStateUpdate", async (oldState, newState) => {
        const logChannel = newState.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (!logChannel) return;

        const user = newState.member.user;

        let action = null;

        if (!oldState.channel && newState.channel) {
            action = `🔊 Joined ${newState.channel}`;
        } else if (oldState.channel && !newState.channel) {
            action = `🔇 Left ${oldState.channel}`;
        } else if (oldState.channel !== newState.channel) {
            action = `🔁 Moved to ${newState.channel}`;
        }

        if (!action) return;

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🎤 Voice Activity")
            .setDescription(`${user.tag}\n${action}`)
            .setTimestamp();

        logChannel.send({ embeds: [embed] });
    });

};