const { AuditLogEvent, PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = async (client) => {

    // 🔥 CONFIG
    const OWNER_ID = "1250850375284818104"; // put your ID

    // 🛡️ When bot role is updated
    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        if (newMember.id !== client.user.id) return;

        const guild = newMember.guild;

        const logs = await guild.fetchAuditLogs({
            type: AuditLogEvent.MemberRoleUpdate,
            limit: 1
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const executor = entry.executor;

        if (!executor || executor.id === OWNER_ID) return;

        try {
            // ❌ Remove all roles from attacker
            const member = await guild.members.fetch(executor.id);
            await member.roles.set([]);

            // 💀 Ban attacker
            await member.ban({ reason: "🚨 Tried to modify bot roles" });

            // 🔒 Lock all channels
            guild.channels.cache.forEach(channel => {
                try {
                    channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false
                    });
                } catch { }
            });

            // 🚨 Alert embed
            const embed = new EmbedBuilder()
                .setColor("#e00000ff")
                .setTitle("🛡️ BOT UNDER ATTACK")
                .setDescription(`
**Executor:** <@${executor.id}>
**Action:** Modified bot roles

🚨 Server locked automatically
💀 Attacker banned
        `)
                .setTimestamp();

            const logChannel = guild.channels.cache.find(c => c.name === "security-logs");
            if (logChannel) logChannel.send({ embeds: [embed] });

        } catch (err) {
            console.log(err);
        }
    });

    // 🧨 When bot is kicked
    client.on("guildMemberRemove", async (member) => {
        if (member.id !== client.user.id) return;

        const guild = member.guild;

        const logs = await guild.fetchAuditLogs({
            type: AuditLogEvent.MemberKick,
            limit: 1
        });

        const entry = logs.entries.first();
        if (!entry) return;

        const executor = entry.executor;

        if (!executor || executor.id === OWNER_ID) return;

        try {
            const user = await guild.members.fetch(executor.id);

            // 💀 Ban attacker
            await user.ban({ reason: "🚨 Kicked the bot" });

        } catch (err) {
            console.log(err);
        }
    });

};