const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

const SAFETY_DIR = path.join(__dirname, "../data/safety");
if (!fs.existsSync(SAFETY_DIR)) fs.mkdirSync(SAFETY_DIR, { recursive: true });

module.exports = {
    name: "safetybackup",
    description: "Structural DNA Backup (Roles & Channels Only)",
    usage: "!safetybackup create | list | delete <id> | clear",
    aliases: ["sfbk", "structuralbackup"],
    whitelistOnly: true,

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();

        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && message.author.id !== message.guild.ownerId) {
            return message.reply({
                components: [V2.container(["🚫 **Access Denied:** Only the Server or Bot Owner can manage structural templates."])]
            });
        }

        const sub = args[0]?.toLowerCase();

        // ─── CREATE ───
        if (sub === "create") {
            const dnaKey = `SF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const status = await message.channel.send({
                components: [V2.container([
                    V2.section([
                        "🧬 EXTRACTING STRUCTURAL DNA",
                        "```diff\n+ Isolating Role Hierarchy\n+ Mapping Sector Coordinates\n+ Encrypting Permission Tables\n```"
                    ], botAvatar)
                ])]
            });

            try {
                const guild = message.guild;
                const backupData = {
                    id: dnaKey,
                    guildName: guild.name,
                    guildId: guild.id,
                    createdAt: new Date().toISOString(),
                    roles: guild.roles.cache
                        .filter(r => !r.managed && r.name !== "@everyone")
                        .sort((a, b) => b.position - a.position)
                        .map(r => ({ id: r.id, name: r.name, color: r.hexColor, permissions: r.permissions.bitfield.toString(), hoist: r.hoist, mentionable: r.mentionable, position: r.position })),
                    channels: []
                };

                // Categories
                guild.channels.cache
                    .filter(c => c.type === ChannelType.GuildCategory)
                    .sort((a, b) => a.position - b.position)
                    .forEach(cat => {
                        backupData.channels.push({
                            name: cat.name, type: cat.type, position: cat.position,
                            overwrites: cat.permissionOverwrites.cache.map(o => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() })),
                            children: guild.channels.cache
                                .filter(c => c.parentId === cat.id)
                                .sort((a, b) => a.position - b.position)
                                .map(c => ({ name: c.name, type: c.type, topic: c.topic || null, position: c.position, bitrate: c.bitrate || null, userLimit: c.userLimit || null, nsfw: c.nsfw || false, rawPosition: c.rawPosition, overwrites: c.permissionOverwrites.cache.map(o => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() })) }))
                        });
                    });

                // Orphaned channels
                guild.channels.cache
                    .filter(c => !c.parentId && c.type !== ChannelType.GuildCategory && !c.thread)
                    .sort((a, b) => a.position - b.position)
                    .forEach(c => {
                        backupData.channels.push({ name: c.name, type: c.type, topic: c.topic || null, position: c.position, bitrate: c.bitrate || null, userLimit: c.userLimit || null, rawPosition: c.rawPosition, overwrites: c.permissionOverwrites.cache.map(o => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() })) });
                    });

                fs.writeFileSync(path.join(SAFETY_DIR, `${dnaKey}.json`), JSON.stringify(backupData, null, 2));

                await status.edit({
                    components: [V2.container([
                        V2.section([
                            "🛡️ STRUCTURAL DNA SECURED",
                            `### **[ DNA_EXTRACT_SUCCESS ]**\n> **DNA Key:** \`${dnaKey}\`\n> **Server:** ${guild.name}\n> **Roles:** \`${backupData.roles.length}\` • **Channel Regions:** \`${backupData.channels.length}\`\n\nUse \`!rstsafbackup ${dnaKey}\` to deploy this to any server.`
                        ], botAvatar),
                        "*interX • Structural Integrity Protocol*"
                    ], "#00FF7F")]
                });

            } catch (err) {
                console.error(err);
                await status.edit({ components: [V2.container(["❌ **Critical Failure:** DNA extraction interrupted."])] });
            }

            // ─── LIST ───
        } else if (sub === "list") {
            const files = fs.readdirSync(SAFETY_DIR).filter(f => f.endsWith(".json"));

            if (files.length === 0) {
                return message.reply({ components: [V2.container(["📭 **Safety Vault is Empty.** Use `!safetybackup create` to save a structural template."])] });
            }

            const items = files.map(file => {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(SAFETY_DIR, file), "utf8"));
                    return `> 🧬 \`${data.id}\` — **${data.guildName}** | Roles: \`${data.roles.length}\` • Channels: \`${data.channels.length}\``;
                } catch (e) { return null; }
            }).filter(Boolean);

            await message.reply({
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("📂 SAFETY ARCHIVE VAULT").setDescription(`**${files.length} Template${files.length !== 1 ? "s" : ""} Stored:**\n\n${items.join("\n")}`).addFields({ name: "📋 Details", value: "*interX • Structural DNA Registry*" }).setFooter({ text: "interX • Security" }).setTimestamp()]
            });

            // ─── DELETE ───
        } else if (sub === "delete") {
            const targetId = args[1]?.toUpperCase();
            if (!targetId) return message.reply({ components: [V2.container(["⚠️ Specify a DNA Key: `!safetybackup delete <KEY>`"])] });
            const targetPath = path.join(SAFETY_DIR, `${targetId}.json`);
            if (!fs.existsSync(targetPath)) return message.reply({ components: [V2.container([`❌ DNA Key \`${targetId}\` not found in vault.`])] });
            fs.unlinkSync(targetPath);
            message.reply({ components: [V2.container([`🗑️ **DNA Purged:** Template \`${targetId}\` has been permanently deleted.`])] });

            // ─── CLEAR ───
        } else if (sub === "clear") {
            const files = fs.readdirSync(SAFETY_DIR).filter(f => f.endsWith(".json"));
            if (files.length === 0) return message.reply({ components: [V2.container(["📭 **Safety Vault is already empty.**"])] });
            files.forEach(f => fs.unlinkSync(path.join(SAFETY_DIR, f)));
            message.reply({ components: [V2.container([`🧹 **Safety Vault Cleared:** \`${files.length}\` templates permanently deleted.`])] });

            // ─── HELP ───
        } else {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("sfbk_create").setLabel("Create Template").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("sfbk_list").setLabel("List Templates").setStyle(ButtonStyle.Secondary)
            );
            await message.reply({
                content: `## 🧬 Safety Backup System\n> \`!safetybackup create\` — Save structural DNA\n> \`!safetybackup list\` — View stored templates\n> \`!safetybackup delete <KEY>\` — Remove a template\n> \`!safetybackup clear\` — Wipe entire vault`,
                components: [row]
            });
        }
    }
};
