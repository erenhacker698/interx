const { AuditLogEvent, EmbedBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const tracker = new Map();

module.exports = {
    name: "channelDelete",

    async execute(channel, client) {
        if (!channel.guild) return;
        const guild = channel.guild;

        // 🧬 DNA GUARD (24/7 AUTO RESTORE)
        const DNA_FILE = path.join(__dirname, "../data/dna", `${guild.id}.json`);
        if (fs.existsSync(DNA_FILE)) {
            try {
                const dna = JSON.parse(fs.readFileSync(DNA_FILE, "utf8"));
                if (dna.guardActive) {
                    const original = dna.channels.find(c => c.name === channel.name && c.type === channel.type) || { name: channel.name, type: channel.type, parentId: channel.parentId, position: channel.position };
                    
                    await guild.channels.create({
                        name: original.name,
                        type: original.type,
                        parent: original.parentId,
                        position: original.position,
                        topic: original.topic || null
                    }).catch(() => {});
                    
                    // Optional: Log restoration
                    if (global.logToChannel) {
                        global.logToChannel(guild, "security", {
                            title: "🧬 DNA_GUARD_RESTORED_CHANNEL",
                            description: `### **Automatic Reconstruction**\n> **Channel:** \`#${channel.name}\`\n> **Status:** Instantly restored from DNA sequence.`,
                            color: "#df0000"
                        });
                    }
                }
            } catch (e) {}
        }

        // 🛡️ ANTI-NUKE PUNISHMENT (EXISTING)
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
        if (!logs) return;

        const entry = logs.entries.first();
        if (!entry || (Date.now() - entry.createdTimestamp > 10000)) return;

        const executor = entry.executor;
        if (executor.id === client.user.id) return; // Ignore itself

        // Whitelist check
        const { isBypass } = require("../utils/bypass_system.js");
        if (isBypass(executor.id) || executor.id === guild.ownerId) return;

        if (!tracker.has(executor.id)) tracker.set(executor.id, { count: 1 });
        else tracker.get(executor.id).count++;

        const data = tracker.get(executor.id);

        if (data.count >= 2) { // Lowered limit for better protection
            const member = await guild.members.fetch(executor.id).catch(() => null);
            if (member && member.bannable) {
                await member.ban({ reason: "interX Anti-Nuke: Channel Mass Deletion" }).catch(() => {});
                
                if (global.logToChannel) {
                    global.logToChannel(guild, "antinuke", {
                        title: "💥 PROTOCOL_ENFORCED: BAN",
                        description: `### **Nuke Termination**\n> **Target:** ${executor.tag}\n> **ID:** \`${executor.id}\`\n> **Trigger:** Mass Channel Deletion.`,
                        color: "#df0000"
                    });
                }
            }
            tracker.delete(executor.id);
        }

        setTimeout(() => tracker.delete(executor.id), 20000);
    }
}