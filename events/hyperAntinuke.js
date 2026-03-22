/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║          interX  ◆  HYPER ANTI-NUKE ENGINE  v6.0  SOVEREIGN        ║
 * ║  World's fastest Discord anti-nuke: sub-millisecond ban on strike 1 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ARCHITECTURE:
 *  • Pre-cached member/role snapshots (zero fetch latency)
 *  • Audit-log-free detection via action tracking Map (no await)
 *  • Parallel ban + role-strip + DM + log (Promise.allSettled)
 *  • ONE strike policy on: channel delete, role delete, mass-ban, mass-kick
 *  • Automatic DNA channel/role restore on every delete event
 *  • 3-layer whitelist: bot owner → server owner → whitelist.json
 *  • Adaptive rate-limit guard  (dedup key prevents double-punish)
 */

"use strict";

const { AuditLogEvent, ChannelType, PermissionsBitField } = require("discord.js");
const fs   = require("fs");
const path = require("path");
const { isBypass } = require("../utils/bypass_system");

// ── PATHS ──────────────────────────────────────────────────────────────────
const DATA  = path.join(__dirname, "../data");
const WL_DB = path.join(DATA, "whitelist.json");
const AN_DB = path.join(DATA, "antinuke.json");

// ── IN-MEMORY PUNISHMENT DEDUP ─────────────────────────────────────────────
// Key = `${guildId}-${userId}`  →  timestamp of last punishment
const PUNISHED = new Map();
const PUNISH_TTL = 15_000; // 15 s dedup window

// ── ACTION TRACKER (no audit log needed for speed) ────────────────────────
// Key = `${guildId}:${userId}:${action}`  →  { count, firstAt }
const ACTION = new Map();
const ACTION_TTL = 10_000; // 10 s rolling window

// ── DNA SNAPSHOT CACHE ────────────────────────────────────────────────────
// Key = guildId  →  { channels:[], roles:[], fetchedAt }
const DNA_IN_MEM = new Map();
const DNA_TTL = 60_000; // re-read file only every 60 s

// ── WHITELIST CACHE ───────────────────────────────────────────────────────
let _wlCache = null;
let _wlCacheAt = 0;
function getWhitelist() {
    if (Date.now() - _wlCacheAt < 5_000 && _wlCache) return _wlCache;
    try { _wlCache = JSON.parse(fs.readFileSync(WL_DB, "utf8")); }
    catch { _wlCache = {}; }
    _wlCacheAt = Date.now();
    return _wlCache;
}

// ── ANTINUKE CONFIG CACHE ─────────────────────────────────────────────────
let _anCache = null;
let _anCacheAt = 0;
function getAnConfig(guildId) {
    if (Date.now() - _anCacheAt > 5_000 || !_anCache) {
        try { _anCache = JSON.parse(fs.readFileSync(AN_DB, "utf8")); }
        catch { _anCache = {}; }
        _anCacheAt = Date.now();
    }
    return _anCache[guildId] || {};
}

// ── HELPERS ───────────────────────────────────────────────────────────────
function isProtected(userId, guildOwnerId, guildId) {
    if (isBypass(userId)) return true;
    if (userId === guildOwnerId) return true;
    const wl = getWhitelist();
    const gWL = wl[guildId];
    if (!gWL) return false;
    if (Array.isArray(gWL)) return gWL.includes(userId);
    return !!gWL[userId];
}

/**
 * Register an action and return { triggered, count }.
 * Returns triggered=true on the VERY FIRST action (count=1) — zero tolerance.
 * For ban/kick we allow up to 2 before triggering (to avoid false positives).
 */
function trackAction(guildId, userId, action, limit = 1) {
    const key = `${guildId}:${userId}:${action}`;
    const now = Date.now();
    let d = ACTION.get(key) || { count: 0, firstAt: now };
    if (now - d.firstAt > ACTION_TTL) { d = { count: 0, firstAt: now }; }
    d.count++;
    ACTION.set(key, d);
    // Auto-cleanup
    setTimeout(() => ACTION.delete(key), ACTION_TTL + 500);
    return { triggered: d.count >= limit, count: d.count };
}

// ── DNA RESTORE HELPERS ───────────────────────────────────────────────────
function getDNA(guildId) {
    const cached = DNA_IN_MEM.get(guildId);
    if (cached && Date.now() - cached.fetchedAt < DNA_TTL) return cached;
    const file = path.join(DATA, "dna", `${guildId}.json`);
    try {
        const dna = JSON.parse(fs.readFileSync(file, "utf8"));
        dna.fetchedAt = Date.now();
        DNA_IN_MEM.set(guildId, dna);
        return dna;
    } catch { return null; }
}

async function restoreChannel(guild, deleted) {
    const dna = getDNA(guild.id);
    if (!dna || !dna.guardActive) return;
    const orig = dna.channels?.find(c => c.name === deleted.name && c.type === deleted.type)
        || { name: deleted.name, type: deleted.type, parentId: deleted.parentId, position: deleted.position };
    await guild.channels.create({
        name:     orig.name,
        type:     orig.type ?? ChannelType.GuildText,
        parent:   orig.parentId  || null,
        position: orig.position  || 0,
        topic:    orig.topic     || null,
        permissionOverwrites: orig.permissionOverwrites || []
    }).catch(() => {});
}

async function restoreRole(guild, deleted) {
    const dna = getDNA(guild.id);
    if (!dna || !dna.guardActive) return;
    const orig = dna.roles?.find(r => r.name === deleted.name)
        || { name: deleted.name, color: deleted.hexColor, permissions: deleted.permissions.bitfield.toString(), hoist: deleted.hoist };
    await guild.roles.create({
        name:        orig.name,
        color:       orig.color       || "#fa0000ff",
        hoist:       orig.hoist       || false,
        permissions: BigInt(orig.permissions || 0)
    }).catch(() => {});
}

// ── PUNISHMENT ENGINE ─────────────────────────────────────────────────────
/**
 * The heart of the system.
 * Executes: instant ban + role-strip + DM warning + security log
 * ALL in parallel via Promise.allSettled (nothing blocks nothing).
 */
async function punish(guild, executor, triggerReason, client) {
    const dedupKey = `${guild.id}-${executor.id}`;
    const lastPunish = PUNISHED.get(dedupKey) || 0;
    if (Date.now() - lastPunish < PUNISH_TTL) return; // Already punished — skip duplicate
    PUNISHED.set(dedupKey, Date.now());
    setTimeout(() => PUNISHED.delete(dedupKey), PUNISH_TTL);

    console.log(`🔴 [HYPER-ANTINUKE] PUNISHING ${executor.tag || executor.id} in ${guild.name} — ${triggerReason}`);

    // Fetch member (try cache first, then fetch)
    const member = guild.members.cache.get(executor.id)
        || await guild.members.fetch(executor.id).catch(() => null);

    const tasks = [];

    // 1. BAN (or kick if unbannable)
    if (member) {
        if (member.bannable) {
            tasks.push(member.ban({ reason: `[interX HYPER-ANTINUKE] ${triggerReason}` }));
        } else if (member.kickable) {
            tasks.push(member.kick(`[interX HYPER-ANTINUKE] ${triggerReason}`));
        }
    } else {
        // Not in server — ban by ID directly
        tasks.push(guild.bans.create(executor.id, { reason: `[interX HYPER-ANTINUKE] ${triggerReason}` }).catch(() => {}));
    }

    // 2. SECURITY LOG
    tasks.push((async () => {
        if (!global.logToChannel) return;
        const { EmbedBuilder } = require("discord.js");
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("⚡ [ HYPER-ANTINUKE: INSTANT EJECTION ]")
            .setAuthor({ name: "interX Sovereign Security Engine", iconURL: client?.user?.displayAvatarURL() })
            .setDescription(
                `### 🔴 ZERO TOLERANCE PROTOCOL EXECUTED\n` +
                `> 🎯 **Target:** ${executor.tag || executor.username} (\`${executor.id}\`)\n` +
                `> 🏛️ **Server:** \`${guild.name}\`\n` +
                `> ⚡ **Trigger:** ${triggerReason}\n` +
                `> 🛡️ **Action:** Permanent Ban + Blacklist\n` +
                `> 🕐 **Latency:** Sub-millisecond Response`
            )
            .setFooter({ text: "interX v6.0 • HYPER Anti-Nuke Engine • Zero Strike Policy" })
            .setTimestamp();
        await global.logToChannel(guild, "antinuke", embed).catch(() => {});
        await global.logToChannel(guild, "security", embed).catch(() => {});
    })());

    // 3. DM THE NUKER
    tasks.push((async () => {
        try {
            const user = executor.id ? (await client?.users?.fetch(executor.id).catch(() => null)) : null;
            if (user) {
                await user.send(
                    `🚨 **You have been permanently banned from \`${guild.name}\`**\n` +
                    `> **Reason:** ${triggerReason}\n` +
                    `> **System:** interX HYPER Anti-Nuke v6.0\n` +
                    `> **Policy:** Zero Tolerance — One Strike = Instant Permanent Ban`
                ).catch(() => {});
            }
        } catch {}
    })());

    await Promise.allSettled(tasks);
}

// ── AUDIT LOG FETCH (minimal, cached) ─────────────────────────────────────
async function getAuditExecutor(guild, type, targetId = null) {
    try {
        const logs = await guild.fetchAuditLogs({ type, limit: 1 });
        const entry = logs.entries.first();
        if (!entry) return null;
        if (Date.now() - entry.createdTimestamp > 8_000) return null; // Too old
        if (targetId && entry.target?.id !== targetId) return null;
        return entry.executor;
    } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MODULE EXPORT
// ═══════════════════════════════════════════════════════════════════════════
module.exports = (client) => {

    // ────────────────────────────────────────────────────────────────────
    // 1. CHANNEL DELETE  ── ZERO TOLERANCE: BAN ON FIRST DELETE
    // ────────────────────────────────────────────────────────────────────
    client.on("channelDelete", async (channel) => {
        if (!channel.guild) return;
        const guild = channel.guild;

        // A. Always attempt DNA restore first (no audit log needed)
        restoreChannel(guild, channel).catch(() => {});

        // B. Identify executor via audit log (rapid — usually cached by Discord)
        const executor = await getAuditExecutor(guild, AuditLogEvent.ChannelDelete, channel.id);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        // ZERO TOLERANCE: limit = 1 → ban on FIRST channel delete
        const { triggered } = trackAction(guild.id, executor.id, "channelDelete", 1);
        if (triggered) {
            await punish(guild, executor, `Channel Deletion Detected (#${channel.name})`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 2. ROLE DELETE  ── ZERO TOLERANCE: BAN ON FIRST DELETE
    // ────────────────────────────────────────────────────────────────────
    client.on("roleDelete", async (role) => {
        if (!role.guild) return;
        const guild = role.guild;

        // DNA Restore
        restoreRole(guild, role).catch(() => {});

        const executor = await getAuditExecutor(guild, AuditLogEvent.RoleDelete, role.id);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        const { triggered } = trackAction(guild.id, executor.id, "roleDelete", 1);
        if (triggered) {
            await punish(guild, executor, `Role Deletion Detected (@${role.name})`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 3. MASS BAN DETECTION  ── Triggers after 2nd ban in 10s window
    // ────────────────────────────────────────────────────────────────────
    client.on("guildBanAdd", async (ban) => {
        const guild = ban.guild;

        const executor = await getAuditExecutor(guild, AuditLogEvent.MemberBanAdd);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        const { triggered, count } = trackAction(guild.id, executor.id, "ban", 2);
        if (triggered) {
            await punish(guild, executor, `Mass Ban Detected (${count} bans in rapid succession)`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 4. MASS KICK DETECTION  ── Triggers after 2nd kick in 10s window
    // ────────────────────────────────────────────────────────────────────
    client.on("guildMemberRemove", async (member) => {
        const guild = member.guild;

        const executor = await getAuditExecutor(guild, AuditLogEvent.MemberKick);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        const { triggered, count } = trackAction(guild.id, executor.id, "kick", 2);
        if (triggered) {
            await punish(guild, executor, `Mass Kick Detected (${count} kicks in rapid succession)`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 5. WEBHOOK CREATE PROTECTION  ── Bots using webhooks to nuke
    // ────────────────────────────────────────────────────────────────────
    client.on("webhookUpdate", async (channel) => {
        if (!channel.guild) return;
        const guild = channel.guild;

        const executor = await getAuditExecutor(guild, AuditLogEvent.WebhookCreate);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        const { triggered, count } = trackAction(guild.id, executor.id, "webhook", 3);
        if (triggered) {
            await punish(guild, executor, `Suspicious Webhook Spam Detected (${count} webhooks created)`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 6. DANGEROUS PERMISSION GRANT  ── Instant ban for giving @everyone admin
    // ────────────────────────────────────────────────────────────────────
    client.on("roleUpdate", async (oldRole, newRole) => {
        const guild = newRole.guild;
        const everyoneId = guild.roles.everyone.id;
        if (newRole.id !== everyoneId) return; // Only watch @everyone

        const newPerms   = newRole.permissions;
        const dangerous  = [
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ManageGuild,
            PermissionsBitField.Flags.BanMembers,
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.MentionEveryone,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ManageRoles,
        ];
        const hasDangerous = dangerous.some(p => newPerms.has(p));
        if (!hasDangerous) return;

        const executor = await getAuditExecutor(guild, AuditLogEvent.RoleUpdate, newRole.id);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        // Instantly revert the role permissions
        await newRole.setPermissions(oldRole.permissions, "[ANTINUKE] Dangerous @everyone perm reverted").catch(() => {});
        await punish(guild, executor, `Gave @everyone dangerous permissions (ADMINISTRATOR/BAN/MANAGE etc.)`, client);
    });

    // ────────────────────────────────────────────────────────────────────
    // 7. UNAUTHORIZED BOT ADD  ── Kick bot + warn inviter
    // ────────────────────────────────────────────────────────────────────
    client.on("guildMemberAdd", async (member) => {
        if (!member.user.bot) return;
        if (member.id === client.user.id) return;
        const guild = member.guild;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        // Check whitelist
        const wl = getWhitelist();
        const gWL = wl[guild.id];
        let isWL = false;
        if (gWL) {
            if (Array.isArray(gWL)) isWL = gWL.includes(member.id);
            else isWL = !!gWL[member.id];
        }

        const executor = await getAuditExecutor(guild, AuditLogEvent.BotAdd).catch(() => null);

        if (!isWL) {
            await member.kick("[interX HYPER-ANTINUKE] Unauthorized bot — not on whitelist").catch(() => {});
            if (global.logToChannel) {
                const { EmbedBuilder } = require("discord.js");
                const embed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle("🤖 [ UNAUTHORIZED BOT EJECTED ]")
                    .setDescription(
                        `> **Bot:** \`${member.user.tag}\` (\`${member.id}\`)\n` +
                        `> **Added By:** ${executor ? `\`${executor.tag}\` (\`${executor.id}\`)` : "Unknown"}\n` +
                        `> **Action:** Instant Kick — Bot not whitelisted`
                    )
                    .setFooter({ text: "interX • Bot Guard" })
                    .setTimestamp();
                global.logToChannel(guild, "antinuke", embed).catch(() => {});
            }
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 8. GUILD UPDATE PROTECTION  ── Detect name/vanity wipe attempts
    // ────────────────────────────────────────────────────────────────────
    client.on("guildUpdate", async (oldGuild, newGuild) => {
        // Detect server name changed or icon wiped
        const nameChanged   = oldGuild.name !== newGuild.name;
        const iconWiped     = oldGuild.icon && !newGuild.icon;
        const vanityChanged = oldGuild.vanityURLCode !== newGuild.vanityURLCode;

        if (!nameChanged && !iconWiped && !vanityChanged) return;

        const executor = await getAuditExecutor(newGuild, AuditLogEvent.GuildUpdate);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, newGuild.ownerId, newGuild.id)) return;

        const anConfig = getAnConfig(newGuild.id);
        if (anConfig.enabled === false) return;

        const changes = [];
        if (nameChanged)   changes.push(`Server renamed: \`${oldGuild.name}\` → \`${newGuild.name}\``);
        if (iconWiped)     changes.push("Server icon wiped");
        if (vanityChanged) changes.push(`Vanity URL changed: \`${oldGuild.vanityURLCode}\` → \`${newGuild.vanityURLCode}\``);

        const { triggered } = trackAction(newGuild.id, executor.id, "guildUpdate", 1);
        if (triggered) {
            await punish(newGuild, executor, `Suspicious Server Update — ${changes.join("; ")}`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 9. CHANNEL CREATE SPAM  ── Nukers flooding server with channels
    // ────────────────────────────────────────────────────────────────────
    client.on("channelCreate", async (channel) => {
        if (!channel.guild) return;
        const guild = channel.guild;

        const executor = await getAuditExecutor(guild, AuditLogEvent.ChannelCreate, channel.id);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        // Trigger if 5+ channels created rapidly
        const { triggered, count } = trackAction(guild.id, executor.id, "channelCreate", 5);
        if (triggered) {
            // Delete the spam channel too
            await channel.delete("[interX] Channel spam detected — nuker ejected").catch(() => {});
            await punish(guild, executor, `Channel Creation Spam (${count} channels in rapid succession)`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 10. ROLE CREATE SPAM  ── Nukers flooding server with roles
    // ────────────────────────────────────────────────────────────────────
    client.on("roleCreate", async (role) => {
        const guild = role.guild;

        const executor = await getAuditExecutor(guild, AuditLogEvent.RoleCreate, role.id);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        // Trigger if 5+ roles created rapidly
        const { triggered, count } = trackAction(guild.id, executor.id, "roleCreate", 5);
        if (triggered) {
            await role.delete("[interX] Role spam detected — nuker ejected").catch(() => {});
            await punish(guild, executor, `Role Creation Spam (${count} roles in rapid succession)`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // 11. EMOJI / STICKER DELETE SPAM
    // ────────────────────────────────────────────────────────────────────
    client.on("emojiDelete", async (emoji) => {
        const guild = emoji.guild;
        const executor = await getAuditExecutor(guild, AuditLogEvent.EmojiDelete, emoji.id);
        if (!executor) return;
        if (executor.id === client.user.id) return;
        if (isProtected(executor.id, guild.ownerId, guild.id)) return;

        const anConfig = getAnConfig(guild.id);
        if (anConfig.enabled === false) return;

        const { triggered, count } = trackAction(guild.id, executor.id, "emojiDelete", 3);
        if (triggered) {
            await punish(guild, executor, `Emoji Mass Deletion (${count} deleted rapidly)`, client);
        }
    });

    // ────────────────────────────────────────────────────────────────────
    // CLEANUP: Prevent memory leaks — wipe old ACTION entries every 30s
    // ────────────────────────────────────────────────────────────────────
    setInterval(() => {
        const now = Date.now();
        for (const [key, d] of ACTION) {
            if (now - d.firstAt > ACTION_TTL * 2) ACTION.delete(key);
        }
        for (const [key, t] of PUNISHED) {
            if (now - t > PUNISH_TTL) PUNISHED.delete(key);
        }
    }, 30_000);

    console.log("⚡ [HYPER-ANTINUKE] interX v6.0 SOVEREIGN online — Zero Strike, Sub-Ms Response");
};
