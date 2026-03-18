const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

const BACKUP_DIR = path.join(__dirname, "../data/backups");

module.exports = {
    name: "restore",
    description: "Military-Grade Server Restoration (Hyper-Speed)",
    usage: "!restore <id>",
    permissions: [PermissionsBitField.Flags.Administrator],
    whitelistOnly: true,

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();

        // Authorization Check
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && message.author.id !== message.guild.ownerId) {
            return message.reply({
                components: [V2.container(["🚫 **Access Denied:** Only the Server or Bot Owner can initiate a restoration."])]
            });
        }

        const backupId = args[0];
        if (!backupId) return message.reply({
            components: [V2.container(["⚠️ **Missing Parameter:** Please provide an archive ID."])]
        });

        const filePath = path.join(BACKUP_DIR, `${backupId}.json`);
        if (!fs.existsSync(filePath)) return message.reply({
            components: [V2.container(["❌ **Archive Fault:** Specified ID does not exist."])]
        });

        let data;
        try {
            data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (e) {
            return message.reply({
                components: [V2.container(["❌ **Archive Corrupted:** Failed to parse JSON data."])]
            });
        }

        // Step 1: Confirmation (plain content + button row — no V2 flag mix)
        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("confirm").setLabel("☢️ CONFIRM NUCLEAR RESTORE").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("cancel").setLabel("✖️ ABORT").setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.reply({
            content: `## ☢️ NUCLEAR RESTORE AUTHORIZATION\n> **Archive:** \`${data.id}\`\n> **Server Snapshot:** ${data.guildName}\n> **Roles:** \`${data.roles.length}\` • **Channels:** \`${data.channels.length}\`\n\n⚠️ This will **PURGE** all current channels and roles, then rebuild from the archive.\n**Command channel will be preserved. Bot roles will stay intact.**`,
            components: [confirmRow]
        });

        const filter = i => i.user.id === message.author.id;
        try {
            const i = await msg.awaitMessageComponent({ filter, time: 40000 });
            if (i.customId === "cancel") {
                return i.update({ content: "❌ **Sequence Aborted.** Restoration protocol terminated.", components: [] });
            }

            await i.update({ content: "☣️ **Sequence Authorized.** Initializing sovereign purge...", components: [] });

            const getStatusContainer = (step) => V2.container([
                V2.section([
                    "☣️ NUCLEAR RESTORATION: ACTIVE",
                    V2.text(step)
                ], botAvatar),
                "*interX • Hyper-Speed Reconstruction Protocol*"
            ]);

            const progress = await message.channel.send({
                content: null,
                components: [getStatusContainer("```diff\n- Phase 0: Initializing Sovereign Purge\n```")]
            });

            try {
                // ───── PHASE 0: SOVEREIGN PURGE (Full Parallel) ─────
                const currentChanId = message.channel.id;
                const botMember = await message.guild.members.fetchMe();
                const botMaxPos = botMember.roles.highest.position;

                const channels = message.guild.channels.cache.filter(c => c.id !== currentChanId);
                const roles = message.guild.roles.cache.filter(r => !r.managed && r.id !== message.guild.id && r.position < botMaxPos);
                const emojis = message.guild.emojis.cache;
                const stickers = message.guild.stickers.cache;

                // 🚀 HYPER PARALLEL PURGE — all at once
                await Promise.all([
                    ...channels.map(c => c.delete().catch(() => { })),
                    ...roles.map(r => r.delete().catch(() => { })),
                    ...emojis.map(e => e.delete().catch(() => { })),
                    ...stickers.map(s => s.delete().catch(() => { }))
                ]);

                // Sync Cache
                await Promise.all([message.guild.roles.fetch(), message.guild.channels.fetch()]);

                // ───── PHASE 1: SERVER DNA SYNC ─────
                await progress.edit({ components: [getStatusContainer("```diff\n+ Phase 0: Sovereign Purge Complete\n- Phase 1: Reconstructing Structural DNA\n```")] });

                if (data.settings) {
                    await message.guild.edit({
                        verificationLevel: data.settings.verificationLevel,
                        defaultMessageNotifications: data.settings.defaultMessageNotifications,
                        explicitContentFilter: data.settings.explicitContentFilter,
                        afkTimeout: data.settings.afkTimeout
                    }).catch(() => { });
                }

                // ───── PHASE 2: ROLE HIERARCHY (Full Parallel) ─────
                await progress.edit({ components: [getStatusContainer("```diff\n+ Phase 1: DNA Sync Complete\n- Phase 2: Aligning Role Hierarchy\n```")] });

                const roleMap = new Map();
                const roleResults = await Promise.all(
                    data.roles.map(rData =>
                        message.guild.roles.create({
                            name: rData.name,
                            color: rData.color,
                            permissions: BigInt(rData.permissions),
                            hoist: rData.hoist,
                            mentionable: rData.mentionable,
                            reason: "Perfect Restore"
                        }).then(newRole => ({ name: rData.name, id: newRole.id })).catch(() => null)
                    )
                );
                roleResults.forEach(r => { if (r) roleMap.set(r.name, r.id); });

                // ───── PHASE 3: CHANNEL WAVE DEPLOYMENT (Full Parallel) ─────
                await progress.edit({ components: [getStatusContainer("```diff\n+ Phase 2: Role Hierarchy Synced\n- Phase 3: Deploying Channel Waves\n```")] });

                const createdCats = new Map();
                const originalRoleLookup = new Map(data.roles.map(r => [r.id, r.name]));

                const mapOverwrites = (oldOverwrites) => {
                    if (!oldOverwrites) return [];
                    return oldOverwrites.map(o => {
                        if (o.type === 1) return { id: o.id, type: o.type, allow: BigInt(o.allow), deny: BigInt(o.deny) };
                        if (o.id === data.guildId) return { id: message.guild.id, type: o.type, allow: BigInt(o.allow), deny: BigInt(o.deny) };
                        const name = originalRoleLookup.get(o.id);
                        const newId = roleMap.get(name);
                        return newId ? { id: newId, type: o.type, allow: BigInt(o.allow), deny: BigInt(o.deny) } : null;
                    }).filter(o => o !== null);
                };

                // WAVE 1: Categories in parallel
                const categoryData = data.channels.filter(c => c.type === ChannelType.GuildCategory);
                const catResults = await Promise.all(
                    categoryData.map(catData =>
                        message.guild.channels.create({
                            name: catData.name,
                            type: ChannelType.GuildCategory,
                            position: catData.position,
                            permissionOverwrites: mapOverwrites(catData.overwrites)
                        }).then(cat => ({ name: catData.name, id: cat.id, children: catData.children })).catch(() => null)
                    )
                );
                catResults.forEach(c => { if (c) createdCats.set(c.name, c.id); });

                // WAVE 2: Sub-channels (all cats in parallel, children of each cat in parallel)
                await Promise.all(
                    catResults.filter(c => c && c.children?.length).map(cat =>
                        Promise.all(
                            cat.children.map(child =>
                                message.guild.channels.create({
                                    name: child.name,
                                    type: child.type,
                                    topic: child.topic,
                                    bitrate: child.bitrate,
                                    userLimit: child.userLimit,
                                    nsfw: child.nsfw,
                                    parentId: createdCats.get(cat.name),
                                    position: child.rawPosition || child.position,
                                    permissionOverwrites: mapOverwrites(child.overwrites)
                                }).catch(() => { })
                            )
                        )
                    )
                );

                // WAVE 3: Orphaned channels in parallel
                const orphans = data.channels.filter(c => c.type !== ChannelType.GuildCategory && !c.children);
                await Promise.all(
                    orphans.map(orphan =>
                        message.guild.channels.create({
                            name: orphan.name,
                            type: orphan.type,
                            position: orphan.rawPosition || orphan.position,
                            permissionOverwrites: mapOverwrites(orphan.overwrites)
                        }).catch(() => { })
                    )
                );

                // ───── PHASE 4: FINALIZATION ─────
                const finalContainer = V2.container([
                    V2.section([
                        "✅ RESTORATION COMPLETE",
                        `### **[ ZERO-DAY SYNC SUCCESS ]**\nServer **${data.guildName}** reconstructed at hyper-speed.\n\n> **Channels:** \`${data.channels.length}\`\n> **Roles:** \`${data.roles.length}\``
                    ], botAvatar),
                    "*interX • Total Synchronization Complete*"
                ], "#00FF7F");

                await progress.edit({ components: [finalContainer] });

            } catch (err) {
                console.error(err);
                const faultContainer = V2.container(["❌ **Critical Restoration Fault.** Error during deployment."]);
                progress.edit({ components: [faultContainer] });
            }
        } catch (e) {
            return message.reply({ components: [V2.container(["🕙 **Restore Action Timed Out.**"])] });
        }
    }
};
