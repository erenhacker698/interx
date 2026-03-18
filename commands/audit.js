const { PermissionsBitField, AuditLogEvent, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "audit",
    description: "Performs a sovereign security audit of the server",
    aliases: ["scan", "securityscan"],

    async execute(message, args) {
        const { guild } = message;

        const loadingContainer = V2.container([
            "🛡️ **ENGAGING SOVEREIGN AUDIT PROTOCOLS...**\n*Scanning server architecture for vulnerabilities.*"
        ]);

        const statusMsg = await message.reply({ content: null, components: [loadingContainer] });

        try {
            const report = { critical: [], warning: [], info: [], neutral: [] };

            // 1. DANGEROUS PERMISSIONS (@EVERYONE)
            const everyone = guild.roles.everyone;
            const dangerousPerms = [
                { perm: PermissionsBitField.Flags.Administrator, name: "Administrator" },
                { perm: PermissionsBitField.Flags.ManageRoles, name: "Manage Roles" },
                { perm: PermissionsBitField.Flags.ManageChannels, name: "Manage Channels" },
                { perm: PermissionsBitField.Flags.ManageGuild, name: "Manage Server" },
                { perm: PermissionsBitField.Flags.ManageWebhooks, name: "Manage Webhooks" },
                { perm: PermissionsBitField.Flags.MentionEveryone, name: "Mention Everyone" },
                { perm: PermissionsBitField.Flags.BanMembers, name: "Ban Members" },
                { perm: PermissionsBitField.Flags.KickMembers, name: "Kick Members" }
            ];

            dangerousPerms.forEach(p => {
                if (everyone.permissions.has(p.perm)) {
                    report.critical.push(`**@everyone** has **${p.name}** permission.`);
                }
            });

            // 2. EXCESSIVE ADMINISTRATORS
            const admins = guild.members.cache.filter(m => m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot);
            if (admins.size > 5) {
                report.warning.push(`**Excessive Admins:** \`${admins.size}\` human administrators detected.`);
            }

            // 3. HIERARCHY ANALYSIS
            const botMember = guild.members.me;
            const botTopRole = botMember.roles.highest;
            const dangerousRoles = guild.roles.cache.filter(r =>
                (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.ManageRoles)) &&
                r.position >= botTopRole.position &&
                r.id !== guild.ownerId
            );

            if (dangerousRoles.size > 0) {
                report.warning.push(`**Hierarchy:** \`${dangerousRoles.size}\` roles above bot have admin powers.`);
            }

            // 4. SERVER SETTINGS
            if (guild.verificationLevel === 0) report.warning.push("**Verification Level:** Set to 'None' (Unsafe).");
            else report.neutral.push(`**Verification Level:** \`${guild.verificationLevel}\``);

            if (guild.mfaLevel === 1) report.neutral.push("**2FA Requirement:** Enabled for staff.");
            else report.info.push("**2FA Requirement:** Not required for moderation.");

            if (guild.explicitContentFilter === 0) report.warning.push("**Content Filter:** Disabled.");

            // 5. RECENT ACTIVITY
            let activityLines = "> • *No activities detected in the last 24 hours.*";
            const logs = await guild.fetchAuditLogs({ limit: 100 }).catch(() => null);
            if (logs) {
                const yesterday = Date.now() - (24 * 60 * 60 * 1000);
                const recentLogs = logs.entries.filter(entry => entry.createdTimestamp > yesterday);
                if (recentLogs.size > 0) {
                    const activity = {};
                    recentLogs.forEach(entry => { activity[entry.action] = (activity[entry.action] || 0) + 1; });
                    activityLines = Object.entries(activity).map(([type, count]) => {
                        let name = "Action " + type;
                        if (type == AuditLogEvent.MemberKick) name = "Kicks";
                        if (type == AuditLogEvent.MemberBanAdd) name = "Bans";
                        if (type == AuditLogEvent.RoleCreate) name = "Roles Created";
                        if (type == AuditLogEvent.ChannelCreate) name = "Channels Created";
                        return `> • **${name}:** \`${count}\``;
                    }).slice(0, 5).join("\n");
                }
            }

            const threatLevel = report.critical.length > 0 ? "🔴 CRITICAL" : (report.warning.length > 0 ? "🟡 ELEVATED" : "🟢 SECURE");
            const reportColor = report.critical.length > 0 ? V2_RED : (report.warning.length > 0 ? "#FFA500" : "#00FF7F");

            const finalContainer = V2.container([
                V2.section([
                    V2.heading(`🛡️ SOVEREIGN SECURITY REPORT: ${guild.name.toUpperCase()}`, 2),
                    `## **THREAT LEVEL:** ${threatLevel}\n*Analysis of server architectural integrity complete.*`
                ], guild.iconURL({ dynamic: true, size: 512 })),
                "📊 SYSTEM AUDIT MAPPINGS",
                V2.text(
                    (report.critical.length > 0 ? `### **[ 🚨 CRITICAL_VULNERABILITIES ]**\n${report.critical.map(v => `> • ${v}`).join("\n")}\n\n` : "") +
                    (report.warning.length > 0 ? `### **[ ⚠️ SECURITY_WARNINGS ]**\n${report.warning.map(v => `> • ${v}`).join("\n")}\n\n` : "") +
                    `### **[ ℹ️ SYSTEM_STATUS ]**\n${[...report.neutral, ...report.info].map(v => `> • ${v}`).join("\n")}`
                ),
                "📜 RECENT TELEMETRY (24H)",
                V2.text(activityLines),
                "*interX • Royal Protocol • Encryption Active*"
            ], reportColor);

            await statusMsg.edit({ content: null, components: [finalContainer] });

        } catch (error) {
            console.error("Audit Error:", error);
            await statusMsg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **PROTOCOL FAILURE:** An internal error occurred during scan.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
