const { PermissionsBitField, EmbedBuilder, ChannelType } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "threatscan",
    description: "🛡️ DEEP THREAT SCAN (Analyze Server Vulnerabilities)",
    aliases: ["ts", "scan", "auditpulse"],
    usage: "!threatscan",
    permissions: [PermissionsBitField.Flags.Administrator],
    whitelistOnly: true,

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner) {
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Only the **Architect** or **Server Owner** can initiate a deep threat scan."])] });
        }

        const scanningMsg = await message.reply({ components: [V2.container(["📡 **INITIATING DEEP THREAT SCAN...**\nAnalyzing roles, channels, and audit streams..."])] });

        try {
            const guild = message.guild;
            const vulnerabilities = [];
            const securepoints = [];

            // 1. Administrative Role Analysis
            const adminRoles = guild.roles.cache.filter(r => r.permissions.has(PermissionsBitField.Flags.Administrator) && r.id !== guild.id);
            if (adminRoles.size > 5) {
                vulnerabilities.push(`🔴 **High Admin Density:** found \`${adminRoles.size}\` roles with Administrative permissions. (Recommend < 3)`);
            } else {
                securepoints.push(`🟢 **Admin Density:** Controlled (\`${adminRoles.size}\` roles)`);
            }

            // 2. Dangerous Roles with Many Holders
            const riskyRoles = adminRoles.filter(r => r.members.size > 5);
            if (riskyRoles.size > 0) {
                vulnerabilities.push(`🟠 **Overshared Privileges:** \`${riskyRoles.first().name}\` has \`${riskyRoles.first().members.size}\` holders. (High risk of account compromised)`);
            }

            // 3. Channel Vulnerability (@everyone mention)
            const mentionEveryoneChannels = guild.channels.cache.filter(c => 
                c.type === ChannelType.GuildText && 
                c.permissionOverwrites.cache.get(guild.id)?.allow.has(PermissionsBitField.Flags.MentionEveryone)
            );
            if (mentionEveryoneChannels.size > 0) {
                vulnerabilities.push(`🔴 **Mention Vector:** Audit found \`${mentionEveryoneChannels.size}\` channels where everyone can mention all roles.`);
            } else {
                securepoints.push(`🟢 **Mention Vectors:** Secured`);
            }

            // 4. Webhook Backdoor Scan
            const webhooks = await guild.fetchWebhooks().catch(() => new Map());
            if (webhooks.size > 10) {
                vulnerabilities.push(`🟠 **Webhook Entropy:** \`${webhooks.size}\` active webhooks detected. Potential for silent backdoors.`);
            } else {
                securepoints.push(`🟢 **Webhook Integrity:** Verified (\`${webhooks.size}\` active)`);
            }

            // 5. Verification Level
            if (guild.verificationLevel < 2) {
                vulnerabilities.push(`🟡 **Soft Entry:** Guild verification level is \`LOW\`. Highly susceptible to auto-raid scripts.`);
            } else {
                securepoints.push(`🟢 **Perimeter Security:** Active (Level ${guild.verificationLevel})`);
            }

            // Final Report
            const threatLevel = vulnerabilities.length > 3 ? "🔴 CRITICAL" : (vulnerabilities.length > 0 ? "🟡 MODERATE" : "🟢 SECURE");
            const color = vulnerabilities.length > 3 ? "#FF0000" : (vulnerabilities.length > 0 ? "#FFCC00" : "#00FF00");

            const scanResult = V2.container([
                V2.section([
                    "🛡️ SECURITY DIAGNOSITCS: SCAN_COMPLETE",
                    `### **[ THREAT_LEVEL: ${threatLevel} ]**\n\n> **Target Guild:** ${guild.name}\n> **Analyzed Sectors:** Roles, Channels, Assets`
                ], V2.botAvatar(message)),
                V2.separator(),
                "🔴 DETECTED VULNERABILITIES",
                vulnerabilities.length > 0 ? vulnerabilities.join('\n') : "✅ No critical vulnerabilities detected.",
                V2.separator(),
                "🟢 SECURED PARAMETERS",
                securepoints.length > 0 ? securepoints.join('\n') : "No secure parameters recorded.",
                V2.separator(),
                "*\"The Architect sees all. Vigilance is the only true defense.\"*"
            ], color);

            await scanningMsg.delete().catch(() => {});
            return message.channel.send({ content: null, components: [scanResult] });

        } catch (err) {
            console.error(err);
            scanningMsg.edit({ components: [V2.container(["❌ **SCAN_ABORTED:** Diagnostic failure during audit pulse."])] });
        }
    }
};
