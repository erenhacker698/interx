const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "rstsafbackup",
    description: "Apply Structural DNA Backup to the current server.",
    usage: "!rstsafbackup <DNA-Key>",
    aliases: ["applydna", "safrestore"],
    whitelistOnly: true,

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && message.author.id !== message.guild.ownerId)
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Only the Server or Bot Owner can deploy structural matrices."])] });

        const dnaKey = args[0]?.toUpperCase();
        if (!dnaKey) return message.reply({ components: [V2.container(["⚠️ Specify a DNA Key: `!rstsafbackup <KEY>`"])] });

        const SAFETY_DIR = path.join(__dirname, "../data/safety");
        const filePath = path.join(SAFETY_DIR, `${dnaKey}.json`);

        if (!fs.existsSync(filePath)) return message.reply({ components: [V2.container([`❌ DNA Key \`${dnaKey}\` not found in archive.`])] });

        let data;
        try { data = JSON.parse(fs.readFileSync(filePath, "utf8")); }
        catch (e) { return message.reply({ components: [V2.container(["❌ Error reading structural template."])] }); }

        // ─── CONFIRMATION ───
        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("confirm_dna").setLabel("⚠️  PROCEED WITH COLLAPSE").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("cancel_dna").setLabel("Abort Sequence").setStyle(ButtonStyle.Secondary)
        );

        const response = await message.reply({
            components: [V2.container([
                "☢️ PROTOCOL OMEGA — CONFIRMATION REQUIRED",
                V2.text(
                    `### **CRITICAL STRUCTURAL OVERWRITE**\n` +
                    `Deploying DNA: \`${dnaKey}\` → **${message.guild.name}**\n\n` +
                    `> ⚠️ **All existing channels & roles will be purged** and replaced.\n` +
                    `> 🔒 **Bot roles & current channel** are protected during the process.\n\n` +
                    `**Authorize sequence to proceed or abort.**`
                ),
                confirmRow
            ])]
        });

        try {
            const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === message.author.id, time: 30000 });

            if (confirmation.customId === "cancel_dna")
                return confirmation.update({ components: [V2.container(["❌ **Sequence Aborted.**"])] });

            await confirmation.update({
                components: [V2.container([V2.section(["⚡ STRUCTURAL COLLAPSE INITIATED", "Purging existing structure and deploying DNA matrix..."], botAvatar)])]
            });

            // ─── PHASE 0: PURGE ───
            const currentChanId = message.channel.id;
            const botMember = await message.guild.members.fetchMe();
            const botMaxPos = botMember.roles.highest.position;

            await Promise.all([
                ...message.guild.channels.cache.filter(c => c.id !== currentChanId).map(c => c.delete().catch(() => { })),
                ...message.guild.roles.cache.filter(r => !r.managed && r.id !== message.guild.id && r.position < botMaxPos).map(r => r.delete().catch(() => { }))
            ]);

            const statusChannel = await message.guild.channels.create({ name: "🧬-restoration-status", type: ChannelType.GuildText, reason: "Structural DNA Deployment" });
            await statusChannel.send({ components: [V2.container(["✅ **Sovereign Purge Complete.** Reconstructing structural matrix..."])] });

            // ─── PHASE 1: ROLES ───
            const roleMap = new Map();
            for (const rData of data.roles.sort((a, b) => a.position - b.position)) {
                try {
                    const newRole = await message.guild.roles.create({ name: rData.name, color: rData.color, permissions: BigInt(rData.permissions), hoist: rData.hoist, mentionable: rData.mentionable, reason: "DNA Deploy" });
                    roleMap.set(rData.name, newRole.id);
                } catch (e) { }
            }

            // ─── PHASE 2: OVERWRITE RESOLVER ───
            const resolveOverwrites = (overwrites) => {
                if (!overwrites) return [];
                return overwrites.map(o => {
                    if (o.type === 1) return { id: o.id, type: 1, allow: BigInt(o.allow), deny: BigInt(o.deny) };
                    if (o.id === data.guildId) return { id: message.guild.id, type: 0, allow: BigInt(o.allow), deny: BigInt(o.deny) };
                    const src = data.roles.find(r => r.id === o.id);
                    if (src) { const nid = roleMap.get(src.name); if (nid) return { id: nid, type: 0, allow: BigInt(o.allow), deny: BigInt(o.deny) }; }
                    return null;
                }).filter(Boolean);
            };

            // ─── PHASE 3: CHANNELS ───
            const createdCats = new Map();
            for (const cat of data.channels.filter(c => c.type === ChannelType.GuildCategory)) {
                try {
                    const nc = await message.guild.channels.create({ name: cat.name, type: cat.type, position: cat.position, permissionOverwrites: resolveOverwrites(cat.overwrites), reason: "DNA Deploy" });
                    createdCats.set(cat.name, nc.id);
                } catch (e) { }
            }

            await Promise.all(data.channels.filter(c => c.type === ChannelType.GuildCategory && c.children).flatMap(cat =>
                cat.children.map(ch => message.guild.channels.create({
                    name: ch.name, type: ch.type, topic: ch.topic, bitrate: ch.bitrate, userLimit: ch.userLimit, nsfw: ch.nsfw,
                    parentId: createdCats.get(cat.name), position: ch.rawPosition || ch.position,
                    permissionOverwrites: resolveOverwrites(ch.overwrites), reason: "DNA Deploy"
                }).catch(() => { }))
            ));

            await Promise.all(data.channels.filter(c => c.type !== ChannelType.GuildCategory && !c.children).map(c =>
                message.guild.channels.create({ name: c.name, type: c.type, topic: c.topic, bitrate: c.bitrate, userLimit: c.userLimit, position: c.rawPosition || c.position, permissionOverwrites: resolveOverwrites(c.overwrites), reason: "DNA Deploy" }).catch(() => { })
            ));

            // ─── FINAL ───
            await statusChannel.send({
                components: [V2.container([
                    V2.section([
                        "🛡️ STRUCTURAL DNA APPLIED",
                        `Server structure from \`${dnaKey}\` has been reconstructed with full fidelity.\n\n> **Roles:** \`${data.roles.length}\`\n> **Channels:** \`${data.channels.length}\``
                    ], botAvatar),
                    "*interX • Safety Archive Protocol*"
                ], "#00FF7F")]
            });

        } catch (e) {
            console.error(e);
            return message.channel.send({ components: [V2.container(["❌ **Sequence Aborted:** Internal error or 30s timeout."])] });
        }
    }
};
