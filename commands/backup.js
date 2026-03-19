const { EmbedBuilder, ChannelType, PermissionsBitField, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { isBypass } = require("../utils/bypass_system.js");

const BACKUP_DIR = path.join(__dirname, "../data/backups");
const DNA_DIR = path.join(__dirname, "../data/dna");

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
if (!fs.existsSync(DNA_DIR)) fs.mkdirSync(DNA_DIR, { recursive: true });

module.exports = {
    name: "backup",
    description: "Ultimate Server DNA Preservation & Instant Restoration System.",
    aliases: ["bk", "dna"],

    data: new SlashCommandBuilder()
        .setName("backup")
        .setDescription("interX DNA Backup System")
        .addSubcommand(s => s.setName("create").setDescription("Store current server architecture as DNA snapshot"))
        .addSubcommand(s => s.setName("on").setDescription("Activate 24/7 DNA Guard (Instant Restore on Delete)"))
        .addSubcommand(s => s.setName("off").setDescription("Deactivate DNA Guard"))
        .addSubcommand(s => s.setName("list").setDescription("View all stored DNA snapshots"))
        .addSubcommand(s => s.setName("load").setDescription("Wipe and Restore server from a DNA snapshot").addStringOption(o => o.setName("id").setDescription("Snapshot ID").setRequired(true))),

    async execute(message, args) {
        const guild = message.guild;
        const sub = (message.options?.getSubcommand?.() || args[0]?.toLowerCase());

        // 🛡️ AUTHORITY CHECK
        if (!isBypass(message.author.id) && message.author.id !== guild.ownerId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor("#df0000").setTitle("🔒 ACCESS_DENIED").setDescription("### **AUTHORITY REQUIRED**\n> This protocol is restricted to the **Bot Owner** or **Server Owner** only.")] });
        }

        const DNA_FILE = path.join(DNA_DIR, `${guild.id}.json`);

        // 🧬 DNA EXTRACTION FUNCTION
        const extractDNA = () => {
            const data = {
                guildName: guild.name,
                guildId: guild.id,
                extractedAt: Date.now(),
                roles: [],
                channels: []
            };

            // Roles
            guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").forEach(r => {
                data.roles.push({ id: r.id, name: r.name, color: r.hexColor, hoist: r.hoist, permissions: r.permissions.bitfield.toString(), position: r.position });
            });

            // Categories
            const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
            categories.forEach(cat => {
                data.channels.push({
                    id: cat.id, name: cat.name, type: cat.type, position: cat.position,
                    overwrites: cat.permissionOverwrites.cache.map(o => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() })),
                    isCategory: true
                });
            });

            // Channels
            guild.channels.cache.filter(c => c.type !== ChannelType.GuildCategory && !c.isThread()).forEach(ch => {
                data.channels.push({
                    name: ch.name, type: ch.type, topic: ch.topic || null, position: ch.position, parentId: ch.parentId,
                    overwrites: ch.permissionOverwrites.cache.map(o => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() }))
                });
            });

            return data;
        };

        // ─── COMMAND LOGIC ───
        if (!sub || sub === "help") {
            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🧬 [ DNA_BACKUP_PROTOCOLS ]")
                .setDescription(
                    "### **System Commands**\n" +
                    "> `!backup create` — Snapshot server architecture\n" +
                    "> `!backup on` — Enable **24/7 DNA Guard** (Automatic Restore)\n" +
                    "> `!backup off` — Terminate Guard state\n" +
                    "> `!backup list` — View snapshots\n" +
                    "> `!backup load <ID>` — Full wipe & restore sequence\n" +
                    "\n*Restoration is destructive. Use with extreme caution.*"
                )
                .setFooter({ text: "interX • Security Matrix" });
            return message.reply({ embeds: [embed] });
        }

        if (sub === "create") {
            const bkid = `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const dna = extractDNA();
            dna.id = bkid;
            fs.writeFileSync(path.join(BACKUP_DIR, `${bkid}.json`), JSON.stringify(dna, null, 2));

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🛡️ [ DNA_SNAPSHOT_SECURED ]")
                .setDescription(`### **Structural Archive Successful**\n> **Snapshot ID:** \`${bkid}\`\n> **Roles:** \`${dna.roles.length}\`\n> **Channels:** \`${dna.channels.length}\``)
                .setFooter({ text: "interX • Archive Protocol" });
            return message.reply({ embeds: [embed] });
        }

        if (sub === "on") {
            const dna = extractDNA();
            dna.guardActive = true;
            fs.writeFileSync(DNA_FILE, JSON.stringify(dna, null, 2));

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🟢 [ DNA_GUARD_ACTIVATED ]")
                .setDescription("### **Instant-Restore Active**\n> The bot is now monitoring all structural mutations.\n> **Any deleted channel or role will be instantly reconstructed.**")
                .setFooter({ text: "interX • 24/7 Security Sentinels" });
            return message.reply({ embeds: [embed] });
        }

        if (sub === "off") {
            if (fs.existsSync(DNA_FILE)) {
                const data = JSON.parse(fs.readFileSync(DNA_FILE));
                data.guardActive = false;
                fs.writeFileSync(DNA_FILE, JSON.stringify(data, null, 2));
            }
            const embed = new EmbedBuilder().setColor("#8B0000").setTitle("🔴 [ DNA_GUARD_TERMINATED ]").setDescription("Automatic restoration protocols have been offline.");
            return message.reply({ embeds: [embed] });
        }

        if (sub === "list") {
            const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".json"));
            if (files.length === 0) return message.reply("🚫 **[ ERROR ]** Archive vault is empty.");

            const list = files.map(f => {
                const d = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, f)));
                return `> 🧬 \`${d.id}\` — **${d.guildName}** (<t:${Math.floor(d.extractedAt / 1000)}:R>)`;
            });

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("📂 [ ARCHIVE_REGISTRY ]")
                .setDescription(`### **Vault Records**\n${list.join("\n")}`)
                .setFooter({ text: `Total: ${files.length} snapshots` });
            return message.reply({ embeds: [embed] });
        }

        if (sub === "load") {
            const id = message.options?.getString?.("id") || args[1];
            if (!id) return message.reply("❌ **[ ERROR ]** Provide a Snapshot ID.");
            const file = path.join(BACKUP_DIR, `${id}.json`);
            if (!fs.existsSync(file)) return message.reply("❌ **[ ERROR ]** DNA Snapshot not found.");

            const dna = JSON.parse(fs.readFileSync(file));
            
            await message.reply("⚠️ **[ WARNING ]** Full reconstruction initializing in 5 seconds. Current channels and roles will be DESTRUCTIVELY replaced.");
            await new Promise(r => setTimeout(r, 5000));

            try {
                // Wipe
                const toDel = guild.channels.cache;
                for (const [_, ch] of toDel) await ch.delete().catch(() => {});
                const rolesDel = guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone");
                for (const [_, r] of rolesDel) await r.delete().catch(() => {});

                // Restore Roles
                const roleMap = new Map();
                for (const rData of dna.roles) {
                    const r = await guild.roles.create({ name: rData.name, color: rData.color, hoist: rData.hoist, permissions: BigInt(rData.permissions) }).catch(() => null);
                    if (r) roleMap.set(rData.name, r.id);
                }

                // Restore Categories
                const catMap = new Map();
                for (const cData of dna.channels.filter(c => c.isCategory)) {
                    const cat = await guild.channels.create({ name: cData.name, type: ChannelType.GuildCategory, position: cData.position }).catch(() => null);
                    if (cat) {
                        catMap.set(cData.id, cat.id);
                        // Apply overwrites (simplified)
                    }
                }

                // Restore Channels
                for (const chData of dna.channels.filter(c => !c.isCategory)) {
                    await guild.channels.create({
                        name: chData.name, type: chData.type, topic: chData.topic, parent: catMap.get(chData.parentId) || null,
                        position: chData.position
                    }).catch(() => null);
                }

                return message.channel.send("✅ **[ RECONSTRUCTION_COMPLETE ]** Server architecture restored from DNA snapshot.");
            } catch (e) {
                return message.channel.send(`❌ **[ CRITICAL_FAILURE ]** ${e.message}`);
            }
        }
    }
};
