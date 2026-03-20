const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const { isBypass } = require("../utils/bypass_system");
const fastCache = require("../utils/fastCache");
const path = require("path");

/**
 * ZERO TOLERANCE PROTOCOL
 * Enforces "One Strike" policy for all bots (even whitelisted ones) 
 * for critical deletions (Channels, Categories, Roles).
 */
module.exports = (client) => {

    const handleZeroTolerance = async (guild, executor, actionType, targetName) => {
        if (!executor || executor.bot === false) return; // Only applies to bots
        if (executor.id === client.user.id) return; // Skip self
        if (isBypass(executor.id)) return; // Skip ultimate authority

        console.log(`📡 [ZeroTolerance] Bot ${executor.tag} deleted ${actionType}: ${targetName}. Enforcement triggered.`);

        try {
            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            // ⚡ INSTANT ENFORCEMENT
            const banReason = `[ZERO_TOLERANCE] Unauthorized ${actionType} deletion by bot.`;
            
            // 1. BAN THE BOT
            if (member.bannable) {
                await member.ban({ reason: banReason }).catch(() => {});
            }

            // 2. LOG TO SECURITY CHANNEL
            const embed = new EmbedBuilder()
                .setColor("#FF0033")
                .setTitle("🚨 [ PROTOCOL: ZERO_TOLERANCE_EJECTION ]")
                .setAuthor({ name: "Sovereign Security Engine", iconURL: client.user.displayAvatarURL() })
                .setDescription(`### 🛡️ ONE-STRIKE POLICY ENFORCED\nA whitelisted or authorized bot violated core security thresholds.`)
                .addFields(
                    { name: "🤖 MALICIOUS ENTITY", value: `${executor.tag} (\`${executor.id}\`)`, inline: true },
                    { name: "📋 VIOLATION", value: `Deleted ${actionType}: \`${targetName}\``, inline: true },
                    { name: "⚡ ACTION", value: "Permanent Ban & System Blacklist", inline: false }
                )
                .setFooter({ text: "interX • Fatal Exception System" })
                .setTimestamp();

            // Notify via global log system if it exists
            if (global.logToChannel) {
                global.logToChannel(guild, "security", embed);
            }

        } catch (e) {
            console.error(`[ZeroTolerance Error]: ${e.message}`);
        }
    };

    // 1. CHANNEL/CATEGORY DELETE MONITOR
    client.on("channelDelete", async (channel) => {
        if (!channel.guild) return;
        
        // Wait briefly for Audit Log to update
        await new Promise(r => setTimeout(r, 1000));
        
        const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete }).catch(() => null);
        const entry = logs?.entries.first();
        if (!entry) return;

        const { executor, target } = entry;
        if (target.id === channel.id && (Date.now() - entry.createdTimestamp < 3000)) {
            const typeText = channel.type === 4 ? "Category" : "Channel";
            handleZeroTolerance(channel.guild, executor, typeText, channel.name);
        }
    });

    // 2. ROLE DELETE MONITOR
    client.on("roleDelete", async (role) => {
        if (!role.guild) return;
        
        await new Promise(r => setTimeout(r, 1000));
        
        const logs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete }).catch(() => null);
        const entry = logs?.entries.first();
        if (!entry) return;

        const { executor, target } = entry;
        if (target.id === role.id && (Date.now() - entry.createdTimestamp < 3000)) {
            handleZeroTolerance(role.guild, executor, "Role", role.name);
        }
    });
};
