const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const { isBypass } = require("../utils/bypass_system");
const fastCache = require("../utils/fastCache");
const path = require("path");

/**
 * ROLE ANTI-ASSIGN PROTOCOL
 * Prevents unauthorized users from giving "Sovereign" or "Bot Administrative" roles to others.
 */
module.exports = (client) => {
    const PROTECTED_ROLES = ["interX!", "interX! anti nuke", "interX! unbypassable", "interX! secure", "interX! anti-raid"];

    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        // Only trigger if roles changed
        if (oldMember.roles.cache.size >= newMember.roles.cache.size) return;

        // Identify newly added roles
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        if (addedRoles.size === 0) return;

        // Check if any of the added roles are protected
        const violations = addedRoles.filter(role => 
            PROTECTED_ROLES.some(p => role.name.toLowerCase().includes(p.toLowerCase())) ||
            role.managed || // Roles created by integrations/bots
            role.permissions.has("Administrator") // Any admin role
        );

        if (violations.size === 0) return;

        // Fetch Audit Logs to find the culprit
        try {
            // Wait slightly for audit log consistency
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberRoleUpdate,
            }).catch(() => null);

            const logEntry = fetchedLogs?.entries.first();
            if (!logEntry) return;

            const { executor, target } = logEntry;

            // If target matches and executor is NOT authorized
            if (target.id === newMember.id && !isBypass(executor.id)) {
                // 1. STRIP THE UNAUTHORIZED ROLES
                for (const [roleId, role] of violations) {
                    await newMember.roles.remove(role, "🛡️ Unauthorized Role Assignment Protection").catch(() => {});
                }

                // 2. LOG THE VIOLATION
                console.log(`🚨 [RoleProtection] ${executor.tag} attempted to give ${violations.map(r => r.name).join(", ")} to ${newMember.user.tag}`);

                const embed = new EmbedBuilder()
                    .setColor("#FF0033")
                    .setTitle("⚖️ [ PROTOCOL: UNAUTHORIZED_ROLE_ASSIGNMENT ]")
                    .setDescription(`An unauthorized attempt to assign administrative/bot roles was detected and neutralized.`)
                    .addFields(
                        { name: "👤 VIOLATOR", value: `${executor} (\`${executor.id}\`)`, inline: true },
                        { name: "🎯 TARGET", value: `${newMember} (\`${newMember.id}\`)`, inline: true },
                        { name: "🛡️ ROLES REVERTED", value: violations.map(r => `\`${r.name}\``).join(", ") }
                    )
                    .setFooter({ text: "interX • Zero Tolerance Governance" })
                    .setTimestamp();

                // Use the global logToChannel if available
                if (global.logToChannel) {
                    global.logToChannel(newMember.guild, "security", embed);
                }

                // 3. OPTIONAL: Punish the violator (strip their roles too)
                const violatorMember = newMember.guild.members.cache.get(executor.id);
                if (violatorMember && violatorMember.bannable && !isBypass(violatorMember.id)) {
                    await violatorMember.roles.set([], "Vicarious Liability: Unauthorized role assignment attempt.").catch(() => {});
                    // await violatorMember.kick("Security Policy Violation: Unauthorized Role Assignment").catch(() => {});
                }
            }
        } catch (error) {
            console.error("Critical Error in RoleProtection handler:", error);
        }
    });
};
