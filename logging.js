const { EmbedBuilder, AuditLogEvent, Events } = require("discord.js");
const path = require("path");
const fs = require("fs");

module.exports = (client) => {

    // Helper: Safely use the global logToChannel from index.js
    async function safeLog(guild, type, payload) {
        if (global.logToChannel) {
            return global.logToChannel(guild, type, payload);
        }
    }

    // ───── MESSAGE LOGS ─────
    client.on(Events.MessageDelete, async (message) => {
        if (!message.guild || message.author?.bot) return;
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🗑️ Message Deleted")
            .setDescription(`**Author:** ${message.author}\n**Channel:** ${message.channel}\n**Content:**\n\`\`\`\n${message.content || "None"}\n\`\`\``)
            .setTimestamp();
        safeLog(message.guild, "message", embed);
    });

    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("📝 Message Edited")
            .setDescription(`**Author:** ${oldMessage.author}\n**Channel:** ${oldMessage.channel}`)
            .addFields(
                { name: "Before", value: `\`\`\`${oldMessage.content || "Empty"}\`\`\`` },
                { name: "After", value: `\`\`\`${newMessage.content || "Empty"}\`\`\`` }
            )
            .setTimestamp();
        safeLog(oldMessage.guild, "message", embed);
    });

    // ───── MEMBER LOGS ─────
    client.on(Events.GuildMemberAdd, (member) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("➡️ Member Joined")
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`**Member:** ${member.user} (\`${member.id}\`)\n**Created On:** <t:${Math.floor(member.user.createdTimestamp/1000)}:R>`)
            .setTimestamp();
        safeLog(member.guild, "joins", embed);
    });

    client.on(Events.GuildMemberRemove, (member) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("⬅️ Member Left")
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`**Member:** ${member.user.tag} (\`${member.id}\`)`)
            .setTimestamp();
        safeLog(member.guild, "leaves", embed);
    });

    client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
        const guild = oldMember.guild;
        // Role Update
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;
        if (oldRoles.size !== newRoles.size) {
            const added = newRoles.filter(r => !oldRoles.has(r.id));
            const removed = oldRoles.filter(r => !newRoles.has(r.id));
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("👤 Role Modification")
                .setDescription(`**Member:** ${newMember.user}`)
                .addFields(
                    { name: "Added", value: added.map(r => `${r}`).join(", ") || "None", inline: true },
                    { name: "Removed", value: removed.map(r => `${r}`).join(", ") || "None", inline: true }
                )
                .setTimestamp();
            safeLog(guild, "role", embed);
        }
        // Nickname
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🏷️ Nickname Update")
                .setDescription(`**Member:** ${newMember.user}\n**Old:** ${oldMember.nickname || "None"}\n**New:** ${newMember.nickname || "None"}`)
                .setTimestamp();
            safeLog(guild, "member", embed);
        }
    });

    // ───── MOD/ADMIN LOGS ─────
    client.on(Events.GuildBanAdd, (ban) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🚫 Member Banned")
            .setDescription(`**User:** ${ban.user.tag} (\`${ban.user.id}\`)\n**Reason:** ${ban.reason || "No reason provided"}`)
            .setTimestamp();
        safeLog(ban.guild, "ban", embed);
    });

    client.on(Events.GuildBanRemove, (ban) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("✅ Member Unbanned")
            .setDescription(`**User:** ${ban.user.tag} (\`${ban.user.id}\`)`)
            .setTimestamp();
        safeLog(ban.guild, "ban", embed);
    });

    // ───── CHANNEL LOGS ─────
    client.on(Events.ChannelCreate, (channel) => {
        if (!channel.guild) return;
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("📁 Channel Created")
            .setDescription(`**Name:** ${channel}\n**ID:** \`${channel.id}\``)
            .setTimestamp();
        safeLog(channel.guild, "channel", embed);
    });

    client.on(Events.ChannelDelete, (channel) => {
        if (!channel.guild) return;
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("💣 Channel Deleted")
            .setDescription(`**Name:** ${channel.name}\n**ID:** \`${channel.id}\``)
            .setTimestamp();
        safeLog(channel.guild, "channel", embed);
    });

    // ───── VOICE LOGS ─────
    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
        const member = newState.member;
        if (!member) return;
        if (!oldState.channelId && newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🔊 Voice Join")
                .setDescription(`**Member:** ${member.user}\n**Channel:** ${newState.channel}`)
                .setTimestamp();
            safeLog(member.guild, "voice", embed);
        } else if (oldState.channelId && !newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🔇 Voice Leave")
                .setDescription(`**Member:** ${member.user}\n**Channel:** ${oldState.channel}`)
                .setTimestamp();
            safeLog(member.guild, "voice", embed);
        } else if (oldState.channelId !== newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🔁 Voice Move")
                .setDescription(`**Member:** ${member.user}\n**From:** ${oldState.channel}\n**To:** ${newState.channel}`)
                .setTimestamp();
            safeLog(member.guild, "voice", embed);
        }
    });

    // ───── ROLE LOGS ─────
    client.on(Events.GuildRoleCreate, (role) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🛡️ Role Created")
            .setDescription(`**Name:** ${role.name}\n**ID:** \`${role.id}\``)
            .setTimestamp();
        safeLog(role.guild, "role", embed);
    });

    client.on(Events.GuildRoleDelete, (role) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🛡️ Role Deleted")
            .setDescription(`**Name:** ${role.name}\n**ID:** \`${role.id}\``)
            .setTimestamp();
        safeLog(role.guild, "role", embed);
    });

    // ───── INVITE LOGS ─────
    client.on(Events.InviteCreate, (invite) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🎟️ Invite Created")
            .setDescription(`**Code:** \`${invite.code}\`\n**Channel:** ${invite.channel}\n**Executor:** ${invite.invoker}`)
            .setTimestamp();
        safeLog(invite.guild, "invite", embed);
    });

    // ───── WEBHOOK LOGS ─────
    client.on(Events.WebhooksUpdate, async (channel) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("⚓ Webhooks Updated")
            .setDescription(`Webhooks were modified in channel: ${channel}`)
            .setTimestamp();
        safeLog(channel.guild, "webhook", embed);
    });

    // ───── EMOJI & STICKER LOGS ─────
    client.on(Events.GuildEmojiCreate, (emoji) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("😀 Emoji Created")
            .setDescription(`**Emoji:** ${emoji} (\`${emoji.name}\`)\n**ID:** \`${emoji.id}\``)
            .setTimestamp();
        safeLog(emoji.guild, "emoji", embed);
    });

    client.on(Events.GuildEmojiDelete, (emoji) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🗑️ Emoji Deleted")
            .setDescription(`**Name:** \`${emoji.name}\`\n**ID:** \`${emoji.id}\``)
            .setTimestamp();
        safeLog(emoji.guild, "emoji", embed);
    });

    client.on(Events.GuildStickerCreate, (sticker) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🖼️ Sticker Created")
            .setDescription(`**Name:** ${sticker.name}\n**ID:** \`${sticker.id}\``)
            .setThumbnail(sticker.url)
            .setTimestamp();
        safeLog(sticker.guild, "sticker", embed);
    });

    client.on(Events.GuildStickerDelete, (sticker) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🗑️ Sticker Deleted")
            .setDescription(`**Name:** ${sticker.name}\n**ID:** \`${sticker.id}\``)
            .setTimestamp();
        safeLog(sticker.guild, "sticker", embed);
    });

    // ───── THREAD LOGS ─────
    client.on(Events.ThreadCreate, (thread) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🧵 Thread Created")
            .setDescription(`**Name:** ${thread.name}\n**Parent:** ${thread.parent}\n**ID:** \`${thread.id}\``)
            .setTimestamp();
        safeLog(thread.guild, "thread", embed);
    });

    client.on(Events.ThreadDelete, (thread) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🗑️ Thread Deleted")
            .setDescription(`**Name:** ${thread.name}\n**ID:** \`${thread.id}\``)
            .setTimestamp();
        safeLog(thread.guild, "thread", embed);
    });

    // ───── BOOST LOGS ─────
    client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
        if (!oldMember.premiumSince && newMember.premiumSince) {
            const embed = new EmbedBuilder()
                .setColor("#f47fff") // Boost Pink
                .setTitle("🚀 Server Boosted!")
                .setDescription(`**Member:** ${newMember.user}\n**Total Boosts:** \`${newMember.guild.premiumSubscriptionCount}\``)
                .setThumbnail(newMember.user.displayAvatarURL())
                .setTimestamp();
            safeLog(newMember.guild, "boost", embed);
        }
    });

    // ───── AUTOMOD LOGS ─────
    client.on(Events.AutoModerationActionExecution, (execution) => {
        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setTitle("🛡️ AutoMod Action")
            .setDescription(`**User:** <@${execution.userId}>\n**Action:** \`${execution.action.type}\`\n**Rule:** \`${execution.ruleId}\`\n**Channel:** <#${execution.channelId}>`)
            .setTimestamp();
        safeLog(execution.guild, "automod", embed);
    });

    // ───── SERVER UPDATE ─────
    client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
        let changes = [];
        if (oldGuild.name !== newGuild.name) changes.push(`**Name:** \`${oldGuild.name}\` ➔ \`${newGuild.name}\``);
        if (oldGuild.icon !== newGuild.icon) changes.push(`**Icon:** Updated`);
        if (oldGuild.banner !== newGuild.banner) changes.push(`**Banner:** Updated`);
        if (oldGuild.discoverySplash !== newGuild.discoverySplash) changes.push(`**Discovery Splash:** Updated`);
        
        if (changes.length > 0) {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🏛️ Server Configuration Updated")
                .setDescription(changes.join("\n"))
                .setTimestamp();
            safeLog(newGuild, "server", embed);
        }
    });

    console.log("🔒 [Powered-Logger] Red Label Engine initialized.");
};