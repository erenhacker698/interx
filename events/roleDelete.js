const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const tracker = new Map();

module.exports = {
    name: "roleDelete",

    async execute(role, client) {
        if (!role.guild) return;
        const guild = role.guild;

        // 🧬 DNA GUARD (24/7 AUTO RESTORE)
        const DNA_FILE = path.join(__dirname, "../data/dna", `${guild.id}.json`);
        if (fs.existsSync(DNA_FILE)) {
            try {
                const dna = JSON.parse(fs.readFileSync(DNA_FILE, "utf8"));
                if (dna.guardActive) {
                    const original = dna.roles.find(r => r.name === role.name) || { name: role.name, color: role.hexColor, permissions: role.permissions.bitfield.toString(), hoist: role.hoist };
                    
                    await guild.roles.create({
                        name: original.name,
                        color: original.color,
                        hoist: original.hoist,
                        permissions: BigInt(original.permissions)
                    }).catch(() => {});
                    
                    if (global.logToChannel) {
                        global.logToChannel(guild, "security", {
                            title: "🧬 DNA_GUARD_RESTORED_ROLE",
                            description: `### **Automatic Reconstruction**\n> **Role:** \`${role.name}\`\n> **Status:** Instantly restored from DNA sequence.`,
                            color: "#df0000"
                        });
                    }
                }
            } catch (e) {}
        }

        // 🛡️ ANTI-NUKE PUNISHMENT
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
        if (!logs) return;

        const entry = logs.entries.first();
        if (!entry || (Date.now() - entry.createdTimestamp > 10000)) return;

        const executor = entry.executor;
        if (executor.id === client.user.id) return;

        const { isBypass } = require("../utils/bypass_system.js");
        if (isBypass(executor.id) || executor.id === guild.ownerId) return;

        if (!tracker.has(executor.id)) tracker.set(executor.id, { count: 1 });
        else tracker.get(executor.id).count++;

        const data = tracker.get(executor.id);

        if (data.count >= 2) {
            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: "interX Anti-Nuke: Role Mass Deletion" }).catch(() => {});
                
                if (global.logToChannel) {
                    global.logToChannel(guild, "antinuke", {
                        title: "💥 PROTOCOL_ENFORCED: BAN",
                        description: `### **Nuke Termination**\n> **Target:** ${executor.tag}\n> **ID:** \`${executor.id}\`\n> **Trigger:** Mass Role Deletion.`,
                        color: "#df0000"
                    });
                }
            }
            tracker.delete(executor.id);
        }

        setTimeout(() => tracker.delete(executor.id), 20000);
    }
}