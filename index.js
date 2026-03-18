// 1. SYSTEM INITIALIZATION
let webServer; // Express Handle

// 2. SUPPRESS NOISY LOGS
process.env.NODE_NO_WARNINGS = "1";
if (process.removeAllListeners) process.removeAllListeners('warning');

// 3. CORE REQUIRES
require("dotenv").config();
const fs = require("fs");
const path = require("path");
require("./v2_shim"); // 🛡️ V2 COMPATIBILITY SHIM
const { Client, GatewayIntentBits, Collection, PermissionsBitField, EmbedBuilder, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID, isBypass } = require("./utils/bypass_system.js");
const V2 = require("./utils/v2Utils");
global.V2 = V2; // 🔥 FIX ALL V2 ERRORS
global.V2_BLUE = "#ff0033"; // Override all blues to Red for interX theme
global.V2_RED = "#ff0000";

const { Message, TextChannel } = require("discord.js");
const originalReply = Message.prototype.reply;
Message.prototype.reply = function (options) {
  if (typeof options === "object" && options.components) {
    let newComponents = [];
    let newEmbeds = options.embeds || [];
    for (let c of options.components) {
      if (c && c.isUltimateEmbed) {
        newEmbeds.push(c.embed);
      } else {
        newComponents.push(c);
      }
    }
    options.components = newComponents;
    if (newEmbeds.length > 0) options.embeds = newEmbeds;
  }
  return originalReply.call(this, options);
};

const originalSend = TextChannel.prototype.send;
TextChannel.prototype.send = function (options) {
  if (typeof options === "object" && options.components) {
    let newComponents = [];
    let newEmbeds = options.embeds || [];
    for (let c of options.components) {
      if (c && c.isUltimateEmbed) {
        newEmbeds.push(c.embed);
      } else {
        newComponents.push(c);
      }
    }
    options.components = newComponents;
    if (newEmbeds.length > 0) options.embeds = newEmbeds;
  }
  return originalSend.call(this, options);
};

// ───── SLASH INTERACTION PATCHES ─────
const { ChatInputCommandInteraction, CommandInteraction, BaseInteraction, MessageComponentInteraction, ModalSubmitInteraction } = require("discord.js");

const patchOptions = (options) => {
  if (typeof options === "object" && options.components) {
    let newComponents = [];
    let newEmbeds = options.embeds || [];
    for (let c of options.components) {
      if (c && c.isUltimateEmbed) {
        newEmbeds.push(c.embed);
      } else {
        newComponents.push(c);
      }
    }
    options.components = newComponents;
    if (newEmbeds.length > 0) options.embeds = newEmbeds;
  }
  return options;
};

const classesToPatch = [ChatInputCommandInteraction, CommandInteraction, BaseInteraction, MessageComponentInteraction, ModalSubmitInteraction];
classesToPatch.forEach(cls => {
  if (!cls || !cls.prototype) return;

  if (cls.prototype.reply && !cls.prototype.reply._patched) {
    const originalReply = cls.prototype.reply;
    cls.prototype.reply = function (options) {
      return originalReply.call(this, patchOptions(options));
    };
    cls.prototype.reply._patched = true;
  }

  if (cls.prototype.followUp && !cls.prototype.followUp._patched) {
    const originalFollowUp = cls.prototype.followUp;
    cls.prototype.followUp = function (options) {
      return originalFollowUp.call(this, patchOptions(options));
    };
    cls.prototype.followUp._patched = true;
  }

  if (cls.prototype.editReply && !cls.prototype.editReply._patched) {
    const originalEditReply = cls.prototype.editReply;
    cls.prototype.editReply = function (options) {
      return originalEditReply.call(this, patchOptions(options));
    };
    cls.prototype.editReply._patched = true;
  }
});

const db = require("./database/db");
console.log("⚡ [PROBE] interX Core System Online - [VER_3.0_SOVEREIGN]");

const PREFIX = "!";
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});
const bot = client; // Global bot pattern for performance
require("./events/securityAlert")(client);
require("./events/nukeTrap")(client);
require("./events/ghostLogger")(client);
require("./logging")(client); // 📋 Extended Logging System
const PROTECTED_ROLES = ["interX!", "interX! anti nuke", "interX! unbypassable", "interX! secure", "interX! anti-raid"];


// ───── SYSTEM COLLECTIONS ─────
client.invites = new Map();
client.commands = new Map();

// ───── CORE MODULES INITIALIZATION ─────
require("./music/distube")(client); // Initializes client.distube
require("./ai/aiResponder.js")(client);

// ───── UNIVERSAL EVENT LOADER ─────
// Loads both functional (Legacy) and modular (Object) events
const eventsDir = path.join(__dirname, "events");
if (fs.existsSync(eventsDir)) {
  const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith(".js"));
  console.log(`🔌 [Events] Loading ${eventFiles.length} event modules...`);
  for (const file of eventFiles) {
    try {
      const handler = require(path.join(eventsDir, file));
      if (typeof handler === "function") {
        handler(client); // Legacy Style: client => { ... }
      } else if (handler.name && typeof handler.execute === "function") {
        // Modular Style: { name: '...', execute: (...) => { ... } }
        if (handler.once) {
          client.once(handler.name, (...args) => handler.execute(...args, client));
        } else {
          client.on(handler.name, (...args) => handler.execute(...args, client));
        }
      }
    } catch (e) {
      console.error(`❌ [Events] Failed to load ${file}:`, e.message);
    }
  }
}

// ───── SLASH COMMAND INTERACTION HANDLER ─────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  // 🛡️ NORMALIZE INTERACTION TO LOOK LIKE MESSAGE (Legacy Support)
  const messageShim = new Proxy(interaction, {
    get(target, prop) {
      if (prop === 'author') return target.user;
      if (prop === 'content') return `/${target.commandName}`; // Simplified
      return target[prop];
    }
  });

  // Extract arguments from slash options
  const input = interaction.options.getString('input') || "";
  const args = input.split(/\s+/).filter(a => a.length > 0);

  try {
    await command.execute(messageShim, args, client);
  } catch (error) {
    console.error(`❌ [CommandError] ${interaction.commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ Error executing command.", ephemeral: true }).catch(() => { });
    }
  }
});

/* 🔴 LOAD AUTO BACKUP SYSTEM HERE */

require("./systems/autoBackup")(client);

// ───── UTILS ─────
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms)); // Default wait

// ───── SYSTEM STATE ─────
const SYSTEM_DB = path.join(__dirname, "data/system.json");
function loadSystemState() {
  if (fs.existsSync(SYSTEM_DB)) {
    try {
      const data = JSON.parse(fs.readFileSync(SYSTEM_DB, "utf8"));
      global.GOD_MODE = data.GOD_MODE || false;
    } catch (e) { global.GOD_MODE = false; }
  } else { global.GOD_MODE = false; }
}
loadSystemState();

// ─── RATE LIMIT MONITOR & ABUSE SHIELD ───
const rateLimitHits = new Map(); // route → { count, firstHit }
client.rest.on('rateLimited', (info) => {
  const route = info.route || 'unknown';
  const now = Date.now();
  const entry = rateLimitHits.get(route) || { count: 0, firstHit: now };
  if (now - entry.firstHit > 30000) { entry.count = 0; entry.firstHit = now; }
  entry.count++;
  rateLimitHits.set(route, entry);

  console.log(`⚠️ [RateLimit] Route=${route} | Global=${info.global} | Timeout=${info.timeToReset}ms | Hits×${entry.count}`);

  if (info.global) {
    console.error("🚨 [RateLimit] GLOBAL RATE LIMIT — all REST paused until reset. Bot STAYS ONLINE (gateway unaffected).");
  }

  // If same route gets hammered 10+ times in 30s — log as potential abuse
  if (entry.count >= 10) {
    console.error(`🚨 [RateLimit] ABUSE ALERT: Route '${route}' hit ${entry.count}x in 30s. Someone may be spam-triggering this endpoint.`);
  }
});

// ─── CRASH RECOVERY ─── (bot NEVER fully dies)
process.on('uncaughtException', (err) => {
  console.error('💥 [CrashRecovery] Uncaught Exception:', err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 [CrashRecovery] Unhandled Rejection — bot continuing:', reason?.message || reason);
});
process.on('SIGTERM', () => {
  global.isShuttingDown = true;
  console.log('🛑 [System] Transitioning out...');
  process.exitCode = 0;
  try { if (webServer) webServer.close(); } catch (e) { }
  try { client.destroy(); } catch (e) { }
  // Allow event loop to clear naturally for a truly clean exit
});
process.on('SIGINT', () => {
  process.exit(0);
});

// ─── PER-USER COMMAND COOLDOWN (Anti-Spam Bomb) ───
// Prevents someone from hammering commands to generate API spam
const cmdCooldowns = new Map(); // userId → lastCommandTime
const CMD_COOLDOWN_MS = 800; // minimum 800ms between commands per user
function isCommandRateLimited(userId) {
  const now = Date.now();
  const last = cmdCooldowns.get(userId) || 0;
  if (now - last < CMD_COOLDOWN_MS) return true; // Too fast
  cmdCooldowns.set(userId, now);
  return false;
}

const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState } = require("@discordjs/voice");

// ───── 24/7 VC FUNCTION ─────
async function joinVC247(guild) {
  const DB_PATH = path.join(__dirname, "data/247.json");
  let channelId = null;

  if (fs.existsSync(DB_PATH)) {
    try {
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      channelId = db[guild.id];
    } catch (e) { }
  }

  try {
    let channel;
    if (channelId) {
      channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    }

    // FALLBACK: Join first available voice channel if no 24/7 or HomeVC set
    if (!channel || channel.type !== 2) {
      channel = guild.channels.cache.find(c => c.type === 2 && c.viewable && c.joinable);
    }

    if (!channel) return;

    // Check if already connected to the correct channel to avoid socket spam
    const existingConnection = getVoiceConnection(guild.id);
    if (existingConnection && existingConnection.joinConfig.channelId === channel.id) {
      return;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true
    });

    connection.on('error', (err) => {
      // Suppress noisy discovery errors that trigger during boot spikes
      if (err.message.includes("IP discovery")) return;
      console.error(`🔊 [VoiceError] ${guild.name}:`, err.message);
    });

    console.log(`🔊 [StickyVoice] Joined ${channel.name} in ${guild.name}`);
  } catch (e) {
    if (!e.message.includes("IP discovery") && !e.message.includes("Voice connection already exists")) {
      // Log as standard info since this is a background auto-retry
      console.log(`[StickyVoice] Background Re-entry in ${guild.name}: ${e.message}`);
    }
  }
}

// ───── SECURITY & TRUST CHAIN CONFIG ─────
const OWNERS_DB = path.join(__dirname, "data/owners.json");
const TRUST_CHAIN_DB = path.join(__dirname, "data/trust_chain.json");

// Cache for High-Scale lookups (1M+ servers)
const ownerCache = new Map(); // guildId -> Set(userIds)

// Helper: Get All Owner IDs (Bot Owner + Server Owner + Extra Owners)
function getOwnerIds(guildId) {
  let owners = [BOT_OWNER_ID, BOT_DEV_ID]; // Always include Bot Owner and Dev
  if (guildId) {
    // 1. Server Owner
    const guild = client.guilds.cache.get(guildId);
    if (guild) owners.push(guild.ownerId);

    // 2. Extra Owners (Check Cache first for speed)
    if (ownerCache.has(guildId)) {
      owners.push(...ownerCache.get(guildId));
    } else {
      // Fallback to JSON for legacy compatibility
      if (fs.existsSync(OWNERS_DB)) {
        try {
          const rawDb = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
          const raw = rawDb[guildId] || [];
          const extraIds = raw.map(o => typeof o === 'string' ? o : o.id);
          owners.push(...extraIds);
        } catch (e) { }
      }
    }
  }
  return [...new Set(owners)]; // Unique IDs
}

/**
 * ONE-TIME MIGRATION PROTOCOL
 * Moves data from JSON to SQL safely on first connection.
 */
async function migrateJSONToSQL() {
  if (!process.env.DATABASE_URL) return;
  console.log('🔄 [Migration] Checking for legacy data to transfer...');

  // 1. Migrate Owners
  if (fs.existsSync(OWNERS_DB)) {
    try {
      const data = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
      for (const [guildId, owners] of Object.entries(data)) {
        for (const owner of owners) {
          const userId = typeof owner === 'string' ? owner : owner.id;
          await db.query(
            'INSERT INTO extra_owners (guild_id, user_id, added_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [guildId, userId, owner.addedBy || BOT_OWNER_ID]
          ).catch(() => { });
        }
      }
      console.log('✅ [Migration] Extra Owners registry secured.');
    } catch (e) { }
  }

  // 2. Migrate Antinuke Configs
  const ANTINUKE_DB_PATH = path.join(__dirname, "data/antinuke.json");
  if (fs.existsSync(ANTINUKE_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(ANTINUKE_DB_PATH, "utf8"));
      for (const [guildId, cfg] of Object.entries(data)) {
        await db.query(
          `INSERT INTO guild_config (guild_id, antinuke_enabled, autorestore_enabled, antinuke_limits) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (guild_id) DO NOTHING`,
          [guildId, cfg.enabled || false, cfg.autorestore !== false, JSON.stringify(cfg.limits || { channelDelete: 2, roleDelete: 2, ban: 3, kick: 3, interval: 10000 })]
        ).catch(() => { });

        if (cfg.whitelisted && Array.isArray(cfg.whitelisted)) {
          for (const uid of cfg.whitelisted) {
            await db.query('INSERT INTO whitelist (guild_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [guildId, uid]).catch(() => { });
          }
        }
      }
      console.log('✅ [Migration] Antinuke configurations secured.');
    } catch (e) { }
  }
}

/**
 * REFRESH OWNER CACHE
 * Fetches from Postgres to keep lookups sub-millisecond
 */
async function refreshOwnerCache(guildId) {
  if (!process.env.DATABASE_URL) return;
  try {
    const res = await db.query('SELECT user_id FROM extra_owners WHERE guild_id = $1', [guildId]);
    const ids = new Set(res.rows.map(r => r.user_id));
    ownerCache.set(guildId, ids);
  } catch (e) {
    console.error(`❌ [Cache] Failed to refresh owners for ${guildId}:`, e.message);
  }
}

// Helper: Log Trust Chain Grant
function logTrustGrant(guildId, granterId, recipientId) {
  let db = {};
  if (fs.existsSync(TRUST_CHAIN_DB)) {
    try { db = JSON.parse(fs.readFileSync(TRUST_CHAIN_DB, "utf8")); } catch (e) { }
  }
  if (!db[guildId]) db[guildId] = {};

  // Log the grant: Recipient -> Granter
  db[guildId][recipientId] = {
    granter: granterId,
    timestamp: Date.now()
  };

  fs.writeFileSync(TRUST_CHAIN_DB, JSON.stringify(db, null, 2));
}

// Helper: Check Trust Chain & Punish Granter
async function checkTrustChainPunishment(guild, recipientId) {
  if (!fs.existsSync(TRUST_CHAIN_DB)) return;

  try {
    const db = JSON.parse(fs.readFileSync(TRUST_CHAIN_DB, "utf8"));
    const guildTrust = db[guild.id];
    if (!guildTrust || !guildTrust[recipientId]) return;

    const granterId = guildTrust[recipientId].granter;

    // FETCH GRANTER (Cache First)
    const granter = guild.members.cache.get(granterId) || await guild.members.fetch(granterId).catch(() => null);

    if (granter) {
      // 1. STRIP ROLES
      await granter.roles.set([]).catch(() => { });

      // 2. REMOVE FROM EXTRA OWNERS & EJECT
      let wasExtraOwner = false;
      const ownersDb = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
      if (ownersDb[guild.id]) {
        if (ownersDb[guild.id].includes(granterId)) wasExtraOwner = true;
        ownersDb[guild.id] = ownersDb[guild.id].filter(id => id !== granterId);
        fs.writeFileSync(OWNERS_DB, JSON.stringify(ownersDb, null, 2));
      }

      // EJECT EXTRA OWNER
      if (wasExtraOwner && !isBypass(granter.id) && granter.id !== guild.ownerId) {
        if (granter.kickable) await granter.kick("Vicarious Liability: Trusted entity violated security protocol.").catch(() => { });
      }

      // 3. LOG VICARIOUS LIABILITY
      const embed = new EmbedBuilder()
        .setColor("#FF0033")
        .setTitle("⚖️ [ PROTOCOL: VICARIOUS_LIABILITY ]")
        .setAuthor({ name: "Sovereign Security Chain Enforcement", iconURL: client.user.displayAvatarURL() })
        .setDescription(`### ⛓️ RECURSIVE ACCOUNTABILITY TRIGGERED\nAccountability has been enforced due to a trusted entity's violation.\n\n> **Granter:** ${granter} (\`${granter.id}\`)\n> **Violator:** <@${recipientId}> (\`${recipientId}\`)`)
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1063/1063196.png")
        .addFields(
          { name: "🛡️ ENFORCEMENT ACTION", value: `- **Roles:** All ranks stripped\n- **Registry:** Removed from Extra Owner List\n- **Ejection:** Kicked/Banned from server\n- **Cleanup:** All secondary bots added by this granter have been purged.` }
        )
        .setFooter({ text: "interX • Zero Tolerance Governance" })
        .setTimestamp();

      logToChannel(guild, "security", embed);

      // Find a public channel for announcement
      const announcementChannel = guild.channels.cache.find(c => c.name.includes("general") || c.name.includes("chat") || c.type === 0);
      if (announcementChannel) {
        announcementChannel.send(`🚨 **Security Enforcement:** ${granter} has been stripped of all roles and removed from the Owner List because a user they trusted (<@${recipientId}>) triggered a security breach.`);
      }

      // Notify Granter via DM
      await granter.send(`⚠️ **SECURITY ALERT:** You have been stripped of permissions in **${guild.name}** because a user YOU trusted (<@${recipientId}>) violated server security. Accountability is absolute.`).catch(() => { });
    }

    // 4. CLEANUP ALL PROTÉGÉS OF THIS GRANTER
    Object.keys(guildTrust).forEach(async (pId) => {
      if (guildTrust[pId].granter === granterId) {
        const pMember = guild.members.cache.get(pId) || await guild.members.fetch(pId).catch(() => null);
        if (pMember && pMember.id !== client.user.id) {
          if (pMember.user.bot) await pMember.ban({ reason: "Vicarious Liability: Granter security breach cleanup." }).catch(() => { });
          else if (pMember.kickable && pId !== recipientId) await pMember.kick("Vicarious Liability: Granter security breach cleanup.").catch(() => { });
        }
        delete guildTrust[pId];
      }
    });

    db[guild.id] = guildTrust;
    fs.writeFileSync(TRUST_CHAIN_DB, JSON.stringify(db, null, 2));

  } catch (e) {
    console.error("Trust Chain Error:", e);
  }
}

// ───── ANTI-NUKE SYSTEM (CORE) ─────
const ANTINUKE_DB = path.join(__dirname, "data/antinuke.json");
const WHITELIST_DB = path.join(__dirname, "data/whitelist.json");
const nukeMap = new Map();

let antinukeCache = {};
let antinukeCacheTime = 0;
let whitelistCache = {};
let whitelistCacheTime = 0;

// ─── WHITELIST HELPERS (new object format) ───
// whitelist.json format: { guildId: { botId: { addedBy, addedAt } } }
function getWhitelistEntry(guildId, userId) {
  const guildWL = whitelistCache[guildId];
  if (!guildWL) return null;
  // Support both old array format and new object format
  if (Array.isArray(guildWL)) return guildWL.includes(userId) ? { addedBy: null } : null;
  return guildWL[userId] || null;
}
function isWhitelisted(guildId, userId) {
  return getWhitelistEntry(guildId, userId) !== null;
}

// Refresh whitelist cache if stale (5s TTL)
function refreshWhitelistCache() {
  if (Date.now() - whitelistCacheTime > 5000) {
    if (fs.existsSync(WHITELIST_DB)) {
      try { whitelistCache = JSON.parse(fs.readFileSync(WHITELIST_DB)); } catch (e) { }
    }
    whitelistCacheTime = Date.now();
  }
}

// Returns: { triggered: boolean, whitelistedGranter: string|null }
function checkNuke(guild, executor, action) {
  if (!executor) return { triggered: false };
  if (executor.id === client.user.id) return { triggered: false };

  // ONLY THE BOT OWNER (CREATOR) IS IMMUNE
  if (isBypass(executor.id)) return { triggered: false };

  // 🛡️ [BOT & SELF-BOT CLASSIFICATION]
  // 1. Explicit Bots (executor.bot)
  // 2. Probable Automation (Self-bots: < 7d age OR No Avatar)
  const isProbableAutomation = executor.bot || (Date.now() - executor.createdTimestamp < 1000 * 60 * 60 * 24 * 7) || !executor.avatar;

  let whitelistedGranter = null;
  if (isProbableAutomation) {
    refreshWhitelistCache();
    const entry = getWhitelistEntry(guild.id, executor.id);
    if (!entry) return { triggered: true, whitelistedGranter: null }; // Untrusted/Self-Bot → INSTANT TRIGGER
    whitelistedGranter = entry.addedBy || null;
  }

  // CONFIG & LIMITS (applies to everyone — humans, extra owners, server owners, whitelisted bots)
  if (Date.now() - antinukeCacheTime > 5000) {
    if (fs.existsSync(ANTINUKE_DB)) {
      try { antinukeCache = JSON.parse(fs.readFileSync(ANTINUKE_DB, "utf8")); } catch (e) { }
    }
    antinukeCacheTime = Date.now();
  }

  const config = antinukeCache[guild.id];
  if (config && config.enabled === false) return { triggered: false };

  const defaultLimits = { channelDelete: 1, roleDelete: 1, ban: 2, kick: 2, interval: 10 };
  const limits = config?.limits || defaultLimits;
  const limit = limits[action] || 3;
  const interval = limits.interval || 10;

  const key = `${guild.id}-${executor.id}-${action}`;
  const data = nukeMap.get(key) || { count: 0, startTime: Date.now() };

  if (Date.now() - data.startTime > interval * 1000) {
    data.count = 1;
    data.startTime = Date.now();
  } else {
    data.count++;
  }
  nukeMap.set(key, data);

  return { triggered: data.count > limit, whitelistedGranter };
}

// ─── ⚡ EMERGENCY SERVER LOCKDOWN ───
// Fires INSTANTLY on nuke detection — single API call per channel
// Denies @everyone before rate limits can delay restoration
const guildLockdowns = new Set(); // Track guilds currently locked down

async function emergencyLockdown(guild, reason = "Anti-Nuke Emergency") {
  if (guildLockdowns.has(guild.id)) return; // Already locked
  guildLockdowns.add(guild.id);
  console.log(`🔒 [EMERGENCY LOCKDOWN] Locking ${guild.name} — Reason: ${reason}`);

  try {
    const everyoneRole = guild.roles.everyone;
    const textChannels = guild.channels.cache.filter(c => c.type === 0 || c.type === 5); // Text + Announcements

    // Fire all in parallel — minimal API footprint, maximum speed
    await Promise.all(
      textChannels.map(ch =>
        ch.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false,
          AddReactions: false,
        }, { reason: `🛡️ interX Emergency Lockdown: ${reason}` }).catch(() => { })
      )
    );

    console.log(`✅ [EMERGENCY LOCKDOWN] ${guild.name} locked — ${textChannels.size} channels frozen.`);

    // Auto-unlock after 60 seconds (gives time for restoration to complete)
    setTimeout(async () => {
      if (!guildLockdowns.has(guild.id)) return;
      await Promise.all(
        textChannels.map(ch =>
          ch.permissionOverwrites.edit(everyoneRole, {
            SendMessages: null, // Reset to inherited
            CreatePublicThreads: null,
            CreatePrivateThreads: null,
            AddReactions: null,
          }, { reason: "🛡️ interX: Auto-unlock after emergency restoration." }).catch(() => { })
        )
      );
      guildLockdowns.delete(guild.id);
      console.log(`🔓 [EMERGENCY LOCKDOWN] ${guild.name} auto-unlocked after restoration window.`);
    }, 60000);

  } catch (e) {
    console.error(`❌ [EMERGENCY LOCKDOWN] Failed for ${guild.name}:`, e.message);
    guildLockdowns.delete(guild.id);
  }
}

const activePunishments = new Set();
async function punishNuker(guild, executor, reason, action = 'ban', whitelistedGranter = null) {
  const cacheKey = `${guild.id}-${executor.id}`;
  if (activePunishments.has(cacheKey)) return;
  activePunishments.add(cacheKey);
  setTimeout(() => activePunishments.delete(cacheKey), 30000); // Prevent duplicates for 30s

  // 0. EMERGENCY LOCKDOWN FIRST — freeze server before anything else
  emergencyLockdown(guild, `Nuker detected: ${executor?.tag || executor?.id || 'unknown'}`);

  // 1. PUNISH EXECUTOR (Cache First)
  try {
    const member = guild.members.cache.get(executor.id) || await guild.members.fetch(executor.id).catch(() => null);
    if (member) {
      if (member.bannable) {
        await member.ban({ reason: `[ANTI-NUKE] ${reason}` });
      } else {
        await member.kick(`[ANTI-NUKE] ${reason}`);
      }
    }
  } catch (e) { }

  // 2. BOT VIOLATION ACCOUNTABILITY (Whitelisted or Invited)
  if (executor.bot) {
    let violatorId = whitelistedGranter;
    let violationType = whitelistedGranter ? "WHITELISTED BOT" : "UNAUTHORIZED BOT";

    // If not whitelisted, try to find who invited the bot via Audit Logs
    if (!violatorId) {
      try {
        const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 10 }).catch(() => null); // 28 = BOT_ADD
        const entry = auditLogs?.entries.find(e => e.target?.id === executor.id);
        if (entry) {
          violatorId = entry.executor?.id;
          violationType = "INVITED BOT (RESTRICTED)";
        }
      } catch (e) { }
    }

    if (violatorId) {
      try {
        const violator = await client.users.fetch(violatorId).catch(() => null);
        if (violator) {
          const isVerified = (executor.flags?.toArray() || []).includes('VerifiedBot');
          const botDisplay = `${executor.tag || executor.username}${isVerified ? ' [✔ Verified]' : ''}`;

          const V2 = require("./utils/v2Utils");
          const { V2_BLUE } = require("./config");

          const container = V2.container([
            V2.section([
              V2.heading("⚠️ SECURITY PROTOCOL: BOT VIOLATION", 2),
              V2.text(`Accountability Enforcement has been triggered in **${guild.name}**.\nA bot you are responsible for has been **banned** for violating security thresholds.`)
            ], client.user.displayAvatarURL({ extension: 'png', size: 512 })),
            V2.separator(),
            V2.text(
              `> 🤖 **Bot:** ${botDisplay} (\`${executor.id}\`)\n` +
              `> 🏛️ **Server:** ${guild.name}\n` +
              `> 📋 **Violation:** ${reason}\n` +
              `> 🚩 **Context:** ${violationType}\n` +
              `> ⚡ **Action:** Instant Ejection & Permanent Ban`
            ),
            V2.text(`**Note:** Even Verified Bots are subject to Sovereign Protocols. You are held responsible for the actions of any bot you invite or whitelist.`),
            V2.separator(),
            V2.heading("📢 MESSAGE FROM SYSTEM", 3),
            V2.text(`kiruku koodhi ya da nee >? , Ennoda kunji maira kooda pudunga mudiyathu da unnala 😂-----!`)
          ], V2_BLUE || "#0099ff");

          await violator.send({
            content: null,
            flags: V2.flag,
            components: [container]
          }).catch(() => { });
        }
      } catch (e) { }

      // Also log to security channel
      const violationEmbed = new EmbedBuilder()
        .setColor('#FF3300')
        .setTitle(`🚨 [ ${violationType} VIOLATION ]`)
        .setDescription(
          `A bot (Verified or not) exceeded security thresholds and was banned.\n\n` +
          `> 🤖 **Bot:** ${executor.tag || executor.username} (\`${executor.id}\`)\n` +
          `> 👤 **Responsible Party:** <@${violatorId}> (\`${violatorId}\`)\n` +
          `> 📋 **Reason:** ${reason}`
        )
        .setFooter({ text: 'interX • Accountability Protocol' })
        .setTimestamp();
      logToChannel(guild, 'security', violationEmbed);
    }
  }

  // 3. CHECK TRUST CHAIN (Punish Granter if applicable — for human nukers)
  if (!executor.bot) {
    await checkTrustChainPunishment(guild, executor.id);
  }
}

// ───── CHANNEL RESTORATION (HYPER-SPEED) ─────
// Redundant channelDelete listener merged above (Line 1505)

// ───── DANGEROUS ROLE MONITOR ─────
// Redundant guildMemberUpdate listener merged at Line 2275

// ... (Rest of Index Code) ...


// ───── COMMAND COLLECTION ─────
client.commands = new Map();

const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command) {
    const cmdName = (command.data && command.data.name) || command.name;
    if (cmdName) {
      client.commands.set(cmdName, command);
    }
  }
}

// ───── READY ─────
// 0. GLOBAL MONITOR DASHBOARD
const { MONITOR_CHANNEL_ID } = process.env;
const { ChannelType } = require("discord.js");

async function updateDashboard(bot) {
  if (!MONITOR_CHANNEL_ID) return;
  try {
    // 1. Get Monitor Channel from Cache (Fast)
    const monitorChannel = bot.channels.cache.get(MONITOR_CHANNEL_ID) || await bot.channels.fetch(MONITOR_CHANNEL_ID).catch(() => null);
    if (!monitorChannel) return;
    const dashGuild = monitorChannel.guild;

    // ───── CATEGORIZED CHANNELS SETUP ─────
    const logCategories = [
      { name: "🛡-SECURITY", channels: ["🛡-security-alerts", "🛡-antinuke-logs"] },
      { name: "🔨-MODERATION", channels: ["🔨-mod-logs", "🔨-tickets"] },
      { name: "👥-MEMBERS", channels: ["👥-member-logs", "👥-alt-raid-alerts"] },
      { name: "💬-MESSAGES", channels: ["💬-message-logs", "💬-ghost-pings"] },
      { name: "🔊-VOICE", channels: ["🔊-voice-logs"] },
      { name: "📂-SYSTEM", channels: ["📂-action-logs", "📂-admin-logs", "📂-bot-system"] }
    ];

    for (const cat of logCategories) {
      let category = dashGuild.channels.cache.find(c => c.name === cat.name && c.type === ChannelType.GuildCategory);
      if (!category) {
        category = await dashGuild.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [{ id: dashGuild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] }]
        }).catch(() => null);
      }
      if (!category) continue;

      for (const chName of cat.channels) {
        let logChannel = dashGuild.channels.cache.find(c => c.name === chName && c.parentId === category.id);
        if (!logChannel) {
          await dashGuild.channels.create({
            name: chName,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Global log stream for ${cat.name}`
          }).catch(() => null);
        }
      }
    }

    // 2. Optimized Guild Loop: Sequential with Delay (Rate Limit Safe)
    const logChannel = dashGuild.channels.cache.find(c => c.name === "📂-bot-system");
    if (!logChannel) return;

    // Fetch messages ONCE for the whole loop
    const dashboardMessages = await logChannel.messages.fetch({ limit: 50 }).catch(() => null);

    for (const guild of bot.guilds.cache.values()) {
      if (guild.id === dashGuild.id) continue;

      // Use Cache for Owner (Fast)
      const ownerId = guild.ownerId;
      const owner = bot.users.cache.get(ownerId);

      const features = guild.features.map(f => `\`${f}\``).join(", ") || "None";
      const embed = new EmbedBuilder()
        .setColor("#2B2D31")
        .setTitle(`📊 **SERVER INTELLIGENCE:** ${guild.name.toUpperCase()}`)
        // ... (rest of embed build remains same)
        .setDescription(
          `> **ID:** \`${guild.id}\`\n` +
          `> **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)\n` +
          `> **Description:** *${guild.description || "None"}*`
        )
        .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
        .setImage("https://media.discordapp.net/attachments/1093150036663308318/1113885934572900454/line-red.gif")
        .addFields(
          { name: "👑 **Top Authority**", value: `> **Tag:** ${owner ? owner.tag : "Fetched via ID"}\n> **ID:** \`${ownerId}\``, inline: true },
          { name: "👥 **Population**", value: `> **Total:** \`${guild.memberCount}\`\n> **Humans:** \`${guild.members.cache.filter(m => !m.user.bot).size}\`\n> **Bots:** \`${guild.members.cache.filter(m => m.user.bot).size}\``, inline: true },
          { name: "\u200b", value: "\u200b", inline: true },
          { name: "💬 **Infrastructure**", value: `> **Channels:** \`${guild.channels.cache.size}\`\n> **Text:** \`${guild.channels.cache.filter(c => c.type === 0).size}\`\n> **Voice:** \`${guild.channels.cache.filter(c => c.type === 2).size}\``, inline: true },
          { name: "🎭 **Assets & Roles**", value: `> **Roles:** \`${guild.roles.cache.size}\`\n> **Emojis:** \`${guild.emojis.cache.size}\`\n> **Stickers:** \`${guild.stickers.cache.size}\``, inline: true },
          { name: "\u200b", value: "\u200b", inline: true },
          { name: "🛡️ **Security Levels**", value: `> **Verification:** \`${guild.verificationLevel}\`\n> **NSFW Level:** \`${guild.nsfwLevel}\`\n> **Explicit Filter:** \`${guild.explicitContentFilter}\``, inline: true },
          { name: "🚀 **Boost Status**", value: `> **Level:** \`${guild.premiumTier}\`\n> **Count:** \`${guild.premiumSubscriptionCount || 0}\``, inline: true },
          { name: "✨ **Features**", value: features.length > 1000 ? features.substring(0, 1000) + "..." : features, inline: false }
        )
        .setFooter({ text: `interX • Global Monitoring • Node: ${process.version}`, iconURL: bot.user.displayAvatarURL() })
        .setTimestamp();

      // 3. Use the fetched messages map
      let existingMsg = dashboardMessages?.find(m =>
        m.author.id === bot.user.id &&
        m.embeds[0]?.title === embed.data.title
      );

      // 3. Create CV2 Container
      const botAvatar = V2.botAvatar({ guild: dashGuild, client: bot });
      const statsSection = V2.section([
        V2.heading("📊 SYSTEM ANALYTICS", 2),
        V2.text(`**Gateway:** \`CONNECTED\`\n**Nodes:** \`${bot.guilds.cache.size}\`\n**Users:** \`${bot.users.cache.size}\``)
      ], botAvatar);

      const latencySection = V2.section([
        V2.heading("📡 NETWORK TRAFFIC", 3),
        V2.text(`**API Latency:** \`${Math.round(bot.ws.ping)}ms\`\n**Response Time:** \`STABLE\``)
      ]);

      const container = V2.container([statsSection, V2.separator(), latencySection]);

      if (existingMsg) {
        await existingMsg.edit({ flags: V2.flag, components: [container] }).catch(() => { });
      } else {
        await logChannel.send({ flags: V2.flag, components: [container] }).catch(() => { });
      }

      // 4. Rate Limit Protection: 1-second delay is enough if we don't fetch every time
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (e) {
    console.error("Dashboard Error:", e);
    // Log more specific error for debugging
    if (e instanceof ReferenceError) {
      console.error("CRITICAL: Missing V2 Builder reference. Check discord.js version or imports.");
    }
  }
}

client.once("ready", async () => {
  // 🏢 Initialize High-Scale Database
  if (process.env.DATABASE_URL) {
    try {
      await db.init();

      // 🔄 Auto-Migration from Legacy Files
      await migrateJSONToSQL();

      // Pre-warm cache for all guilds on start
      console.log(`🔥 [Cache] Warming up owner registry for ${client.guilds.cache.size} nodes...`);
      for (const [id, guild] of client.guilds.cache) {
        await refreshOwnerCache(id);
      }
    } catch (e) {
      console.error('⚠️ [Database] Failed to connect to PostgreSQL. Running in Legacy Mode (JSON).');
    }
  } else {
    console.log('ℹ️ [Legacy] DATABASE_URL not found. System running in file-based fallback mode.');
  }

  console.log(`✅ [System] ${client.user.tag} authorized. Neural network operational.`);
  console.log(`📊 [System] Synchronized with ${client.guilds.cache.size} nodes.`);

  client.nukingGuilds = new Set();
  client.commands.forEach(cmd => { if (typeof cmd.init === "function") cmd.init(client); });


  setTimeout(async () => {
    if (global.isShuttingDown) return;
    updateDashboard(client).catch(() => { });
    for (const guild of client.guilds.cache.values()) {
      if (global.isShuttingDown) break;
      await joinVC247(guild);
      await wait(1500);
    }
  }, 10000);

  // ───── IMMEDIATE TASKS ─────
  const activities = [
    { name: "Server Security | 🛡️ Active", type: 3 },
    { name: "Packet Traffic | 🟢 Stable", type: 3 },
    { name: "for Intruders | 👁️ Scanning", type: 3 },
    { name: "interX Prime | 👑 Online", type: 0 }
  ];

  let i = 0;
  setInterval(() => {
    if (global.isShuttingDown) return;
    client.user.setPresence({
      activities: [activities[i]],
      status: 'dnd',
    });
    i = (i + 1) % activities.length;
  }, 10000);
});

client.on("guildCreate", async (guild) => {
  console.log(`[SOVEREIGN_SYSTEM] 📡 Node Detected: ${guild.name} (${guild.id}). Initializing Sovereign Protocol in 3s...`);
  await wait(3000); // 🕒 Wait for cache & permission propagation

  updateDashboard(client);

  // 🛡️ SOVEREIGN ROLE DEPLOYMENT PROTOCOL
  try {
    const me = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
    if (!me) {
      console.error(`[SOVEREIGN_ERROR] Could not fetch self member in ${guild.name}. Initialization aborted.`);
      return;
    }

    console.log(`[SOVEREIGN_SYSTEM] Analyzing permissions in ${guild.name}...`);
    const hasAdmin = me.permissions.has(PermissionsBitField.Flags.Administrator);
    const canManageRoles = me.permissions.has(PermissionsBitField.Flags.ManageRoles);

    // 1. Check for existing Sovereign role
    let sovereignRole = guild.roles.cache.find(r => r.name === "interX!" || r.name === ".interX!");

    if (!sovereignRole && (canManageRoles || hasAdmin)) {
      console.log(`[SOVEREIGN_SYSTEM] Creating sovereign role 'interX!' in ${guild.name}...`);
      sovereignRole = await guild.roles.create({
        name: "interX!",
        color: "#FF0000", // interX Red
        permissions: [PermissionsBitField.Flags.Administrator],
        hoist: true,
        reason: "Sovereign Protection: Automatic Protocol Initialization."
      }).catch(() => null);
    }

    // ─── 🔴 AUTO-ADMIN ENFORCEMENT ───
    if (!hasAdmin) {
      console.log(`[SOVEREIGN_SYSTEM] Manual Admin scan initiated for ${guild.name}...`);
      // Try to find ANY role with Admin that we can grab
      const existingAdmin = guild.roles.cache.find(r =>
        r.permissions.has(PermissionsBitField.Flags.Administrator) &&
        r.editable &&
        r.name !== "@everyone"
      );

      if (existingAdmin) {
        console.log(`[SOVEREIGN_SYSTEM] Found existing Admin role '${existingAdmin.name}'. Snatching...`);
        await me.roles.add(existingAdmin).catch(() => { });
      } else if (canManageRoles) {
        // We can't create an Admin role if we don't have Admin ourselves (Discord restriction),
        // but if we have Manage Roles, we might be able to create a high-tier support role.
        console.log(`[SOVEREIGN_SYSTEM] No Admin role found. System in restricted recovery mode.`);
      }
    }

    if (sovereignRole) {
      console.log(`[SOVEREIGN_SYSTEM] Assigning sovereign role to self...`);
      await me.roles.add(sovereignRole).catch(e => console.error(`[SOVEREIGN_ERROR] Role assignment failed: ${e.message}`));

      // 4. Elevate hierarchy
      const botHighest = me.roles.highest.position;
      if (sovereignRole.position < botHighest - 1) {
        console.log(`[SOVEREIGN_SYSTEM] Raising role hierarchy...`);
        await sovereignRole.setPosition(botHighest > 1 ? botHighest - 1 : 1).catch(() => { });
      }
    }

    // 5. ENFORCEMENT & ACCOUNTABILITY
    if (!me.permissions.has(PermissionsBitField.Flags.Administrator)) {
      console.log(`[SOVEREIGN_SECURITY] CRITICAL: Administrator permissions restricted in ${guild.name}. Tracing inviter...`);

      const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }).catch(() => null);
      const log = auditLogs?.entries.first();
      const inviter = log?.executor;

      if (inviter) {
        console.log(`[SOVEREIGN_SECURITY] Inviter identified: ${inviter.tag} (${inviter.id})`);
        const inviterMember = await guild.members.fetch(inviter.id).catch(() => null);

        if (inviterMember) {
          await inviterMember.send(`⚠️ **SECURITY VIOLATION:** You attempted to initialize **interX!** in **${guild.name}** without granting Sovereign Administrator permissions. Accountability enforced.`).catch(() => { });

          if (inviterMember.kickable) {
            console.log(`[SOVEREIGN_SECURITY] Ejecting inviter: ${inviter.tag}`);
            await inviterMember.kick("Security: Unauthorized initialization with restricted permissions.").catch(() => { });
          } else {
            console.warn(`[SOVEREIGN_SECURITY] Inviter ${inviter.tag} is not kickable (Higher hierarchy or owner).`);
          }
        }
      } else {
        console.warn(`[SOVEREIGN_SECURITY] Could not catch inviter in audit logs (Bot lacks 'View Audit Log' or log delay).`);
        // Notify Server Owner instead
        const owner = await guild.members.fetch(guild.ownerId).catch(() => null);
        if (owner) {
          await owner.send(`🛡️ **SECURITY ALERT:** **interX!** joined **${guild.name}** but was not granted Sovereign Administrator permissions. System is operating in restricted mode. Please elevate the bot to prevent protocol failure.`).catch(() => { });
        }
      }
    } else {
      console.log(`[SOVEREIGN_SYSTEM] Deployment successful. Node '${guild.name}' is now protected.`);
    }

  } catch (e) {
    console.error(`[SOVEREIGN_CRASH] Critical failure in deployment logic:`, e);
  }

  // 🛡️ AUTO-ENABLE SECURITY ON JOIN
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const initConfig = (filePath, defaultData) => {
    let db = {};
    if (fs.existsSync(filePath)) {
      try { db = JSON.parse(fs.readFileSync(filePath, "utf8")); } catch (e) { }
    }
    if (!db[guild.id]) {
      db[guild.id] = defaultData;
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
    }
  };

  // Anti-Nuke (ALWAYS ON by default, 1s window)
  initConfig(path.join(dataDir, "antinuke.json"), {
    enabled: true,
    whitelisted: [],
    autorestore: true,
    limits: { channelDelete: 1, roleDelete: 1, ban: 2, kick: 2, interval: 10 }
  });

  // Anti-Raid (ALWAYS ON by default, 1s window)
  initConfig(path.join(dataDir, "antiraid.json"), {
    enabled: true,
    threshold: 4,
    timeWindow: 0.01
  });

  // AutoMod
  initConfig(path.join(dataDir, "automod.json"), {
    antiLinks: true,
    antiSpam: true,
    antiBadWords: true,
    antiMassMentions: true,
    whitelist: []
  });

  // 🔊 INSTANT VOICE JOIN ON ENTRY
  joinVC247(guild);
});
client.on("guildDelete", async (guild) => {
  if (!MONITOR_CHANNEL_ID) return;
  const monitorChannel = bot.channels.cache.get(MONITOR_CHANNEL_ID) || await bot.channels.fetch(MONITOR_CHANNEL_ID).catch(() => null);
  if (!monitorChannel) return;
  const dashGuild = monitorChannel.guild;
  const channelName = `📂︱${guild.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20) || "unknown"}`.toLowerCase();
  const logChannel = dashGuild.channels.cache.find(c => c.name === channelName);

  if (logChannel) {
    logChannel.send("❌ **BOT LEFT THIS SERVER**");
    logChannel.setName(`❌︱${guild.name.substring(0, 10)}`).catch(() => { });
  }
});

// ───── VOICE STATE UPDATE: STICKY VOICE ENFORCEMENT ─────
const homeVCCooldown = new Map(); // guildId → timestamp of last home-return attempt

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.id !== client.user.id) return; // Only track our own bot

  try {
    // 1. Bot was disconnected or kicked from VC
    if (!newState.channelId) {
      console.log(`📡 [StickyVoice] Bot disconnected in ${newState.guild.name}. Attempting re-entry in 5s...`);
      await wait(5000);
      joinVC247(newState.guild);
      return;
    }

    // 2. HomeVC Enforcement with cooldown to prevent infinite loop
    const DB_PATH = path.join(__dirname, "data/247.json");
    if (fs.existsSync(DB_PATH)) {
      const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
      const homeChannelId = db[newState.guild.id];

      // Already in home channel → stop
      if (!homeChannelId || newState.channelId === homeChannelId) return;

      // Cooldown: Only attempt return once per 5 seconds to prevent loop
      const lastAttempt = homeVCCooldown.get(newState.guild.id) || 0;
      if (Date.now() - lastAttempt < 5000) return;

      console.log(`📡 [HomeVC] Bot moved in ${newState.guild.name}. Returning home...`);
      homeVCCooldown.set(newState.guild.id, Date.now());
      await wait(5);
      joinVC247(newState.guild);
    }
  } catch (e) {
    console.error(`[StickyVoice] State Update Error:`, e);
  }
});

// Primary crash handlers are at the top of the file

// ───── MESSAGE HANDLER ─────
// ─── 🤖 CROSS-BOT NUKE COMMAND INTERCEPTOR ───
// Detects when another bot in the server responds to or executes a nuke-style command
// Tracks the human who triggered it + the bot itself
const NUKE_PATTERNS = [
  // ── DIRECT NUKE COMMANDS ──
  /\bnuke\b/i, /\bnuked\b/i, /\bnuking\b/i, /\bsnuke\b/i, /\bgnuke\b/i, /\brnuke\b/i,
  /\bserver\s*nuke/i, /\bnuke\s*server/i, /\braid\s*nuke/i, /\bnuke\s*all/i,
  /\bnuke\s*bot/i, /\bbot\s*nuke/i, /\bnuke\s*cmd/i, /\bnuke\s*command/i,

  // ── MASS DELETE OPERATIONS ──
  /mass\s*delete/i, /delete\s*all/i, /delete\s*every/i, /del\s*all/i,
  /delete.*channel/i, /delete.*role/i, /delete.*category/i,
  /channel.*delete/i, /role.*delete/i, /purge.*channel/i, /clear.*channel/i,
  /wipe.*channel/i, /remove.*channel/i, /strip.*channel/i, /flush.*channel/i,
  /drop.*channel/i, /erase.*channel/i, /terminate.*channel/i,

  // ── MASS BAN / KICK ──
  /mass\s*ban/i, /ban\s*all/i, /ban\s*every/i, /ban\s*everyone/i, /ban\s*members/i,
  /mass\s*kick/i, /kick\s*all/i, /kick\s*every/i, /kick\s*everyone/i, /kick\s*members/i,
  /hackban/i, /hack\s*ban/i, /force\s*ban/i, /global\s*ban/i, /bulk\s*ban/i,
  /mass\s*unban/i, /unban\s*all/i, /ban\s*wave/i, /ban\s*hammer/i,

  // ── SERVER DESTRUCTION ──
  /destroy.*server/i, /server.*destroy/i, /wipe.*server/i, /server.*wipe/i,
  /obliterate/i, /annihilate/i, /eradicate/i, /demolish.*server/i,
  /liquidate.*server/i, /dismantle.*server/i, /disintegrate/i, /decimate.*server/i,
  /terminate.*server/i, /purge.*server/i, /sanitize.*server/i, /cleanse.*server/i,
  /kill.*server/i, /server.*kill/i, /end.*server/i, /finish.*server/i,
  /ruin.*server/i, /crash.*server/i, /burn.*server/i, /nuke.*guild/i,

  // ── RAIDS ──
  /\braid\b/i, /\braiding\b/i, /\braided\b/i, /server.*raid/i, /raid.*server/i,
  /mass.*raid/i, /raid.*bot/i, /raid.*join/i, /invite.*flood/i, /join.*flood/i,
  /member.*flood/i, /raid.*tool/i, /raid.*script/i,

  // ── BYPASS & EXPLOIT TERMS ──
  /bypass/i, /byp\b/i, /\bbypass\s*antinuke/i, /bypass.*protection/i,
  /bypass.*security/i, /bypass.*bot/i, /exploit/i, /exploiting/i,
  /bypass.*perm/i, /bypass.*role/i, /bypass.*check/i, /circumvent/i,
  /\boverride\b/i, /override.*permission/i, /override.*security/i,
  /evade/i, /evasion/i, /evading.*security/i, /skip.*security/i,
  /disable.*antinuke/i, /disable.*security/i, /disable.*bot/i, /turn.*off.*bot/i,
  /kill.*bot/i, /stop.*bot/i, /bot.*bypass/i, /anti.*antinuke/i,

  // ── ROLE / PERMISSION ABUSE ──
  /mass.*role/i, /role.*all/i, /strip.*role/i, /remove.*all.*role/i,
  /delete.*all.*role/i, /clear.*role/i, /wipe.*role/i, /purge.*role/i,
  /admin.*everyone/i, /give.*admin.*all/i, /mass.*admin/i,
  /permission.*override/i, /perm.*hack/i, /role.*hack/i, /admin\s*abuse/i,

  // ── WEBHOOK ABUSE ──
  /webhook.*spam/i, /spam.*webhook/i, /webhook.*flood/i, /mass.*webhook/i,
  /fake.*webhook/i, /clone.*webhook/i, /webhook.*nuke/i, /webhooks.*delete/i,

  // ── CHANNEL SPAM / FLOOD ──
  /channel.*spam/i, /spam.*channel/i, /flood.*channel/i, /channel.*flood/i,
  /message.*flood/i, /flood.*message/i, /mass.*message/i, /message.*spam/i,
  /spam.*everyone/i, /mention.*spam/i, /spam.*mention/i, /ping.*everyone/i,
  /everyone.*spam/i, /ping.*flood/i, /role.*mention.*spam/i, /ghost.*ping/i,

  // ── TOKEN / ACCOUNT THEFT TERMS ──
  /grab.*token/i, /token.*grab/i, /steal.*token/i, /token.*steal/i,
  /token.*log/i, /token.*logger/i, /log.*token/i, /hack.*account/i,
  /account.*hack/i, /cookie\s*grab/i, /cookie\s*stealer/i, /ip.*grab/i,
  /ip.*logger/i, /grab.*ip/i, /doxx/i, /dox\b/i, /credential/i,

  // ── SPECIFIC NUKE BOT COMMAND PATTERNS ──
  /!nuke/i, /\.nuke/i, /\/nuke/i, /-nuke/i, /\?nuke/i, /\+nuke/i,
  /!raid/i, /\.raid/i, /\/raid/i, /-raid/i, /!destroy/i, /!wipe/i,
  /!purgeall/i, /!banall/i, /!kickall/i, /!massban/i, /!masskick/i,
  /!clearall/i, /!deleteall/i, /!nukeserver/i, /!serverraid/i,
  /\.purge\s*(all|\d{3,})/i, /\.ban\s*all/i, /\.kick\s*all/i,
  /\/purge\s*(all|\d{3,})/i, /\bpurgeall\b/i, /\bkickall\b/i, /\bbanall\b/i,

  // ── AUTOMATED / SCRIPT INDICATORS ──
  /running.*script/i, /script.*running/i, /auto.*nuke/i, /nuke.*auto/i,
  /automated.*attack/i, /bot.*attack/i, /attack.*bot/i, /executing.*nuke/i,
  /nuke.*executing/i, /protocol.*0/i, /protocol.*zero/i, /scorched.*earth/i,
  /slash.*and.*burn/i, /shock.*and.*awe/i, /carpet.*bomb/i,

  // ── SOCIAL ENGINEERING / TAKEOVER ──
  /server.*takeover/i, /takeover.*server/i, /hijack.*server/i, /server.*hijack/i,
  /own.*server/i, /pwn.*server/i, /control.*server/i, /server.*control/i,
  /seize.*control/i, /server.*taken/i, /we.*own.*this/i, /owned.*server/i,
  /coup/i, /hostile.*takeover/i, /server.*compromised/i, /compromised.*server/i,

  // ── GENERAL DESTRUCTIVE INTENT ──
  /going.*nuke/i, /about.*to.*nuke/i, /initiating.*nuke/i, /nuke.*initiated/i,
  /nuke.*complete/i, /nuke.*done/i, /server.*wiped/i, /wiped.*server/i,
  /all.*channels.*deleted/i, /deleted.*all.*channels/i, /everything.*deleted/i,
  /fully.*nuked/i, /successfully.*nuked/i, /raid.*successful/i,

  // ── SPECIFIC KNOWN NUKE BOT OUTPUT PHRASES ──
  /annihilation.*complete/i, /destruction.*complete/i, /protocol.*activated/i,
  /mass.*destruction/i, /total.*destruction/i, /full.*server.*wipe/i,
  /server.*has.*been.*nuked/i, /has.*been.*destroyed/i, /server.*is.*gone/i,
  /everything.*is.*gone/i, /nothing.*left/i, /wiping.*everything/i,
  /deleting.*all/i, /banning.*all/i, /kicking.*all/i, /clearing.*everything/i,
  /your.*server.*is.*mine/i, /server.*belongs.*to/i, /i.*own.*your.*server/i,

  // ── NUKE BOT LIVE STATUS / PROGRESS OUTPUT ──
  // These are messages printed by nuke bots AS they run — caught mid-execution

  // Checking / Scanning
  /checking.*permission/i, /checking.*role/i, /checking.*channel/i,
  /checking.*member/i, /checking.*server/i, /checking.*whitelist/i,
  /checking.*antinuke/i, /checking.*security/i, /checking.*bot/i,
  /checking.*access/i, /checking.*admin/i, /checking.*owner/i,
  /scanning.*server/i, /scanning.*channel/i, /scanning.*role/i,
  /scanning.*member/i, /scanning.*permission/i, /scanning.*target/i,
  /scanning.*guild/i, /scan.*complete/i, /scan.*done/i, /scan.*finished/i,

  // Initializing / Loading
  /initializing.*nuke/i, /nuke.*initializing/i, /initializing.*raid/i,
  /initializing.*attack/i, /loading.*nuke/i, /nuke.*loading/i,
  /loading.*modules/i, /loading.*payload/i, /payload.*loaded/i,
  /loading.*tools/i, /loading.*script/i, /loading.*exploit/i,
  /module.*loaded/i, /modules.*ready/i, /ready.*to.*nuke/i,
  /ready.*to.*raid/i, /ready.*to.*attack/i, /ready.*to.*destroy/i,
  /system.*ready/i, /armed.*and.*ready/i, /weapon.*ready/i,

  // Connecting / Targeting
  /connecting.*to.*server/i, /connected.*to.*server/i, /target.*acquired/i,
  /target.*locked/i, /targeting.*server/i, /targeting.*guild/i,
  /acquiring.*target/i, /locking.*target/i, /server.*targeted/i,
  /guild.*targeted/i, /found.*target/i, /target.*found/i,

  // Executing / Running
  /executing.*payload/i, /payload.*executing/i, /executing.*command/i,
  /executing.*script/i, /script.*executing/i, /running.*nuke/i,
  /running.*attack/i, /running.*raid/i, /running.*payload/i,
  /executing.*attack/i, /attack.*executing/i, /running.*exploit/i,
  /exploit.*running/i, /process.*started/i, /attack.*started/i,
  /nuke.*started/i, /raid.*started/i, /starting.*nuke/i, /starting.*raid/i,
  /starting.*attack/i, /launching.*attack/i, /attack.*launched/i,

  // Verifying / Fetching
  /verifying.*permission/i, /verifying.*access/i, /verifying.*admin/i,
  /verifying.*token/i, /verifying.*bypass/i, /verifying.*exploit/i,
  /fetching.*channel/i, /fetching.*role/i, /fetching.*member/i,
  /fetching.*server/i, /fetching.*guild/i, /fetching.*permission/i,
  /fetching.*token/i, /collecting.*data/i, /gathering.*data/i,
  /gathering.*info/i, /pulling.*data/i, /extracting.*data/i,

  // Progress indicators
  /\[\d+\/\d+\].*delet/i, /\[\d+\/\d+\].*ban/i, /\[\d+\/\d+\].*kick/i,
  /\[\d+\/\d+\].*nuke/i, /\[\d+\/\d+\].*wipe/i, /\[\d+\/\d+\].*purg/i,
  /done.*\d+.*channel/i, /deleted.*\d+.*channel/i, /wiped.*\d+.*channel/i,
  /banned.*\d+.*member/i, /kicked.*\d+.*member/i, /purged.*\d+/i,
  /channels.*remaining/i, /roles.*remaining/i, /members.*remaining/i,
  /\d+.*channels.*deleted/i, /\d+.*roles.*deleted/i, /\d+.*members.*banned/i,

  // Success / Completion
  /attack.*complete/i, /attack.*finished/i, /attack.*successful/i,
  /raid.*complete/i, /raid.*finished/i, /raid.*successful/i,
  /exploit.*complete/i, /exploit.*successful/i, /bypass.*successful/i,
  /bypass.*complete/i, /override.*successful/i, /override.*complete/i,
  /hack.*complete/i, /hack.*successful/i, /mission.*complete/i,
  /mission.*accomplished/i, /operation.*complete/i, /operation.*successful/i,
  /task.*complete/i, /job.*done/i, /finished.*nuking/i, /done.*nuking/i,

  // Error / Failure (still suspicious if a bot is outputting these)
  /failed.*to.*bypass/i, /bypass.*failed/i, /antinuke.*detected/i,
  /security.*detected/i, /bot.*detected/i, /caught.*by.*antinuke/i,
  /blocked.*by.*security/i, /unable.*to.*nuke/i, /nuke.*blocked/i,
  /raid.*blocked/i, /attack.*blocked/i, /exploit.*failed/i,
];

// Track last message per channel to associate bot response with human trigger
const lastHumanMessage = new Map(); // channelId → { user, content, timestamp }

client.on("messageCreate", async message => {
  if (!message.guild) return;

  // Track human messages for cross-bot correlation (no return — main handler processes them too)
  if (!message.author.bot) {
    lastHumanMessage.set(message.channel.id, {
      user: message.author,
      content: message.content,
      timestamp: Date.now()
    });
    return; // Exit THIS listener only — main handler fires separately as its own listener
  }

  // ── BOT MESSAGE ANALYSIS ──
  if (message.author.id === client.user.id) return; // Skip ourself

  const msgContent = (message.content || "") + JSON.stringify(message.embeds.map(e => e.title + " " + e.description).join(" "));
  const isNukeResponse = NUKE_PATTERNS.some(p => p.test(msgContent));

  if (isNukeResponse) {
    console.log(`🚨 [CrossBotDetect] Bot ${message.author.tag} sent nuke-pattern message in ${message.guild.name}`);

    // 1. Check if a human triggered this in the last 10s
    const lastHuman = lastHumanMessage.get(message.channel.id);
    if (lastHuman && Date.now() - lastHuman.timestamp < 10000) {
      const invoker = lastHuman.user;
      const isOwner = isBypass(invoker.id); // ONLY bot owner is immune — extra owners, server owner are NOT

      if (!isOwner) {
        console.log(`🚨 [CrossBotDetect] Human invoker: ${invoker.tag} — kicking.`);
        const invokerMember = message.guild.members.cache.get(invoker.id) || await message.guild.members.fetch(invoker.id).catch(() => null);
        if (invokerMember && invokerMember.kickable) {
          await invokerMember.send(`⚠️ **SECURITY:** You triggered a nuke command via **${message.author.tag}** in **${message.guild.name}**. You are being removed.`).catch(() => { });
          await invokerMember.kick("Security: Triggered nuke command via external bot.").catch(() => { });
        }
      }
    }

    // 2. Neutralize the rogue bot
    const botMember = message.guild.members.cache.get(message.author.id) || await message.guild.members.fetch(message.author.id).catch(() => null);
    await enforceRogueBot(message.guild, botMember, "Nuke command pattern detected in bot message");
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // ⚡ ANTI-SPAM BOMB: silently drop if user is firing too fast (< 800ms between commands)
  if (isCommandRateLimited(message.author.id)) return;

  // ───── MENTION PREFIX NORMALIZATION ─────
  // Supports: @Bot !wl list  OR  @Bot wl list
  const content = message.content.trim();
  if (!content) return;

  const mentionPrefixes = [`<@${client.user.id}>`, `<@!${client.user.id}>`];
  let normalizedContent = content;

  for (const mention of mentionPrefixes) {
    if (content.startsWith(mention)) {
      let afterMention = content.slice(mention.length).trim();
      // If there's nothing after mention, show help
      if (!afterMention) {
        const helpCmd = client.commands.get("help");
        if (helpCmd) return helpCmd.execute(message, [], "mention");
        return;
      }
      // Strip leading ! if present after mention (e.g. @Bot !cmd => cmd)
      if (afterMention.startsWith(PREFIX)) afterMention = afterMention.slice(PREFIX.length);
      normalizedContent = PREFIX + afterMention;
      break;
    }
  }


  const isBotOwner = isBypass(message.author.id);
  const isServerOwner = message.guild.ownerId === message.author.id;

  // ───── GLOBAL BLACKLIST CHECK (MESSAGE) ─────
  // OWNER BYPASS: Owner is immune to blacklist
  if (!isBotOwner) {
    const BL_PATH = path.join(__dirname, "data/blacklist.json");
    if (fs.existsSync(BL_PATH)) {
      try {
        const blacklist = JSON.parse(fs.readFileSync(BL_PATH, "utf8"));
        if (blacklist.includes(message.author.id)) return; // Silently ignore blacklisted users
      } catch (e) { }
    }
  }

  // ───── CONSOLIDATED WHITELIST CHECK ─────
  let whitelistedUsers = [];

  // Load from antinuke config
  if (fs.existsSync(ANTINUKE_DB)) {
    try {
      const db = JSON.parse(fs.readFileSync(ANTINUKE_DB, "utf8"));
      if (db[message.guild.id]?.whitelisted) whitelistedUsers.push(...db[message.guild.id].whitelisted);
    } catch (e) { }
  }

  // Load from separate whitelist file
  if (fs.existsSync(WHITELIST_DB)) {
    try {
      const wl = JSON.parse(fs.readFileSync(WHITELIST_DB, "utf8"));
      if (wl[message.guild.id]) whitelistedUsers.push(...wl[message.guild.id]);
    } catch (e) { }
  }

  const isWhitelisted = whitelistedUsers.includes(message.author.id) || isBotOwner || isServerOwner;

  // ───── GOD LOCK: RESTRICTED CHANNELS/ROLES ─────
  const RESTRICTED_DB = path.join(__dirname, "data/restricted.json");
  let restrictedData = {};
  if (fs.existsSync(RESTRICTED_DB)) {
    try { restrictedData = JSON.parse(fs.readFileSync(RESTRICTED_DB, "utf8")); } catch (e) { }
  }
  const guildRestrictions = restrictedData[message.guild.id] || {};

  // 1. LINK LOCK
  if (guildRestrictions.links && guildRestrictions.links.includes(message.channel.id) && !isBotOwner) {
    const linkRegex = /(https?:\/\/[^\s]+)/ig;
    if (linkRegex.test(content)) {
      message.delete().catch(() => { });
      return; // Silent delete
    }
  }

  // ───── AUTO-MOD SYSTEM ─────
  try {
    const { checkAutomod } = require("./utils/automodSystem");
    await checkAutomod(message, client);
  } catch (e) {
    console.error("AutoMod Error:", e);
  }

  // 1. OWNER TAG RESPONSE (Universal)
  if ((message.mentions.users.has(BOT_OWNER_ID) || message.mentions.users.has(BOT_DEV_ID) || message.mentions.everyone || message.mentions.here) && !isBotOwner && !message.author.bot) {
    if (!normalizedContent.startsWith(PREFIX)) {
      const V2 = require("./utils/v2Utils");
      const { V2_BLUE } = require("./config");

      const tagContainer = V2.container([
        V2.section(
          [
            V2.heading("🛡️ SECURITY ALERT: AUTHORITY DETECTED", 2),
            V2.text(`### **[ PROTECTION_PROTOCOL ]**\n> ⚠️ **Alert:** You tagged a System Authority.\n> 🛡️ **Status:** Sovereign Protection ACTIVE`)
          ],
          client.user.displayAvatarURL()
        ),
        V2.separator(),
        V2.field("📂 INTERROGATION_LOG", `> **Tagged by:** ${message.author}\n> **Identifier:** \`${message.author.id}\`\n> **Channel:** ${message.channel}`),
        V2.separator(),
        V2.text("*\"Every mention is logged in the Audit Kernel. The Architect is watching.\"*"),
        V2.separator(),
        V2.text("*interX Sovereign Shield • Master Defense Matrix*")
      ], V2_BLUE);

      await message.reply({ content: null, flags: V2.flag, components: [tagContainer] });
      return;
    }
  }

  // 2. BOT TAG RESPONSE (Direct Mentions Only)
  if (message.mentions.users.has(client.user.id) && !message.author.bot) {
    if (content.trim() === `<@${client.user.id}>` || content.trim() === `<@!${client.user.id}>`) {
      const V2 = require("./utils/v2Utils");
      const { V2_BLUE } = require("./config");

      const botContainer = V2.container([
        V2.section(
          [
            V2.heading("⚙️ BLUE SEAL PRIME SYSTEM", 2),
            V2.text(`**Status:** Operational\n**Prefix:** \`${PREFIX}\`\n**Mode:** Premium V2 Standard`)
          ],
          client.user.displayAvatarURL()
        ),
        V2.separator(),
        V2.text(`> Use \`${PREFIX}help\` to view accessible commands.`),
        V2.separator(),
        V2.text("*interX Intelligence Architecture*")
      ], V2_BLUE);

      await message.reply({ content: null, flags: V2.flag, components: [botContainer] });
      return;
    }
  }

  // ───── LOGGING: FILES, ADMIN CMDS, ACTIONS ─────

  if (message.attachments.size > 0) {
    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("📁 FILE UPLOADED")
      .setThumbnail(message.author.displayAvatarURL())
      .setDescription(`**Author:** ${message.author}\n**Channel:** ${message.channel}`)
      .addFields({ name: "📄 Files", value: message.attachments.map(a => `[${a.name}](${a.url})`).join("\n") })
      .setTimestamp()
      .setFooter({ text: "interX • File Log" });
    logToChannel(message.guild, "file", embed);
  }

  // ───── PREFIX COMMANDS (EVERYONE) ─────
  if (normalizedContent.startsWith(PREFIX)) {
    const args = normalizedContent.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();


    if (!commandName) return;

    // 2. BOT CMD LOCK CHECK
    if (!isBotOwner) {
      // Channel Lock
      if (guildRestrictions.botcmds_channel && guildRestrictions.botcmds_channel.includes(message.channel.id)) {
        return; // Ignore commands in locked channels
      }
      // Role Lock
      if (guildRestrictions.botcmds_role) {
        const hasRestrictedRole = message.member.roles.cache.some(r => guildRestrictions.botcmds_role.includes(r.id));
        if (hasRestrictedRole) return; // Ignore commands from locked roles
      }
    }

    // ───── SOVEREIGN SHIELD: ANTI-OWNER PROTECTION ─────
    const targetId = message.mentions.users.first()?.id || (args[0]?.match(/^\d+$/) ? args[0] : null);

    if (targetId) {
      const isTargetingOwner = (targetId === BOT_OWNER_ID || targetId === BOT_DEV_ID) && !isBotOwner;

      if (isTargetingOwner) {
        const V2 = require("./utils/v2Utils");
        const { V2_RED } = require("./config");

        const roasts = [
          "Nice try, but I don't take orders from peasants when it comes to the Architect.",
          "Your permission level: 0. My respect for that attempt: also 0.",
          "Critical failure. Just like your social life.",
          "Access denied. Maybe try asking your mom for permission first?",
          "The Architect is immune to your petty commands.",
          "Do you even know who you're talking to? Pathetic.",
          "Error 403: User too irrelevant to perform this action."
        ];
        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        const dangerousCmds = ["kick", "ban", "timeout", "warn", "qr", "quarantine", "mute"];
        const isDangerous = dangerousCmds.includes(commandName);

        let shieldContent = [
          V2.section(
            [
              V2.heading("🛡️ SOVEREIGN_SHIELD: ACCESS_DENIED", 2),
              V2.text(`**Protocol 0 Critical Violation**\n\n### 🚫 INTRUSION DETECTED\n**${roast}**`)
            ],
            V2.thumbnail("https://cdn-icons-png.flaticon.com/512/2716/2716612.png")
          ),
          V2.separator(),
          V2.field("📊 SYSTEM_STATUS", `> **Threat Level:** ${isDangerous ? "🔴 CRITICAL" : "🟡 MODERATE"}\n> **Defensive Mode:** ACTIVE\n> **Target Status:** IMMUNE (ARCHITECT)`),
          V2.separator(),
          V2.section([
            V2.text(`**👤 INTRUDER:** ${message.author} (\`${message.author.id}\`)\n**🛡️ RESPONSE:** ${isDangerous ? "⚠️ **STRIKE LOGGED**" : "🚫 **BLOCKED**"}`)
          ])
        ];

        if (isDangerous) {
          const STRIKES_PATH = path.join(__dirname, "data/strikes.json");
          let strikes = {};
          if (fs.existsSync(STRIKES_PATH)) {
            try { strikes = JSON.parse(fs.readFileSync(STRIKES_PATH, "utf8")); } catch (e) { }
          }
          const userStrikes = (strikes[message.author.id] || 0) + 1;
          strikes[message.author.id] = userStrikes;
          fs.writeFileSync(STRIKES_PATH, JSON.stringify(strikes, null, 2));

          if (userStrikes >= 3) {
            // strike 3: KICK
            shieldContent.push(V2.separator());
            shieldContent.push(V2.heading("🚨 CRITICAL ESCALATION (STRIKE 3/3)", 3));
            shieldContent.push(V2.text("**3 Strikes Reached: AUTOMATIC SERVER EJECTION.**\nSee you never."));

            const container = V2.container(shieldContent, V2_RED);
            await message.reply({ content: null, flags: V2.flag, components: [container] });

            if (message.member.kickable) {
              await message.member.kick("🛡️ Sovereign Shield: Repeated attempts to target Bot Owner (3 Strikes).").catch(() => { });
            }
            return;
          } else if (userStrikes === 2) {
            // strike 2: WARNING
            shieldContent.push(V2.separator());
            shieldContent.push(V2.heading("🚨 HEAVY ESCALATION (STRIKE 2/3)", 3));
            shieldContent.push(V2.text("**2nd Strike Detected.**\n*This is your final warning.* One more attempt will result in your immediate removal from the server."));

            return message.reply({ content: null, flags: V2.flag, components: [V2.container(shieldContent, V2_RED)] });
          } else {
            // strike 1: WARNING
            shieldContent.push(V2.separator());
            shieldContent.push(V2.heading("⚠️ VIOLATION RECORDED (STRIKE 1/3)", 3));
            shieldContent.push(V2.text(`**History Created.** Your attempt to \`${commandName}\` the Architect has been permanently logged in the Audit Kernel.`));

            return message.reply({ content: null, flags: V2.flag, components: [V2.container(shieldContent, V2_RED)] });
          }
        }

        shieldContent.push(V2.separator());
        shieldContent.push(V2.text("*interX Sovereign Security • Zero Tolerance Protocol*"));

        return message.reply({ content: null, flags: V2.flag, components: [V2.container(shieldContent, V2_RED)] });
      }
    }

    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    // 2. Action/Admin Logging
    const embed = new EmbedBuilder()
      .setColor(isBotOwner ? "#FFD700" : "#34495E")
      .setTitle(isBotOwner ? "👑 ADMIN COMMAND EXECUTION" : "⚡ ACTION LOG")
      .addFields(
        { name: "👤 User", value: `${message.author}`, inline: true },
        { name: "📍 Channel", value: `${message.channel}`, inline: true },
        { name: "⌨️ Command", value: `\`!${commandName} ${args.join(" ")}\`` }
      )
      .setTimestamp()
      .setFooter({ text: `interX • ${isBotOwner ? "Admin" : "Action"} Log` });
    logToChannel(message.guild, isBotOwner ? "admin" : "action", embed);


    // 3. WHITELIST ENFORCEMENT (DANGEROUS CMDS)
    // isWhitelisted is already calculated above

    if (command.whitelistOnly && !isWhitelisted) {
      const deniedEmbed = new EmbedBuilder()
        .setColor("#2F3136")
        .setTitle("🔒 [ SECURITY_CLEARANCE_FAILURE ]")
        .setAuthor({ name: "interX Gatekeeper", iconURL: client.user.displayAvatarURL() })
        .setDescription(
          `### 🛡️ RESTRICTED PROTOCOL\n` +
          `**Command:** \`!${commandName}\`\n\n` +
          `> *Access to this sector is limited to **Authorized Personnel** only. Your credentials do not match the required trust level for this operation.*`
        )
        .addFields({ name: "📄 LOG_METADATA", value: "`Unauthorized access attempt recorded.`" })
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/3135/3135715.png")
        .setFooter({ text: "interX • Sovereign Security Network" })
        .setTimestamp();

      return message.reply({ embeds: [deniedEmbed] });
    }







    // OWNER BYPASS: If user is Bot Owner, skip all permission checks
    if (isBotOwner) {
      // Access Granted - Owner is Invincible
    } else {
      // Check for specific permissions
      if (command.permissions) {
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
          return message.reply("⚠️ **Access Denied:** You do not have the required permissions to use this command.");
        }
      }
    }

    try {
      console.log(`[CMD] Executing !${commandName} by ${message.author.tag}`);
      await command.execute(message, args, commandName);
      console.log(`[CMD] Success: !${commandName}`);
    } catch (err) {
      console.error(`[CMD] Error in !${commandName}:`, err);
      if (err.code === 50013 && (isBotOwner || message.author.id === message.guild.ownerId)) {
        return message.reply({
          content: "⚠️ **ACCESS DENIED BY DISCORD PROTOCOLS**",
          embeds: [new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🛑 RESTRAINED")
            .setDescription("My Master, I am unable to execute this command because I lack the necessary permissions.\n\n> *\"I could bypass this, but I don't want to get banned... Give me the 'Administrator' role and I will destroy them for you.\"*")
            .setFooter({ text: "System Error: Missing Permissions" })
          ]
        });
      }
      message.reply("❌ An error occurred while executing the command.");
    }
    return;
  }

  // ───── NO PREFIX: CHECK ONLY IF IT MATCHES A COMMAND (OWNER ONLY) ─────
  {
    const args = content.split(/\s+/);
    const commandName = args[0].toLowerCase();
    const command = client.commands.get(commandName);

    if (command && (isBotOwner || isServerOwner)) {
      args.shift();
      try {
        await command.execute(message, args, commandName);
      } catch (err) {
        if (err.code === 50013 && isBotOwner) {
          return message.reply({ content: `⚠️ **I don't have permission to do that here.**\n> *"Dude, no perms given... Shall I nuke it instead? (in a funny way)"* ☢️😏` });
        }
        console.error(err);
        message.reply("❌ An error occurred.");
      }
    }
  }
});

// ───── SLASH COMMAND HANDLER (BRIDGE) ─────
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return interaction.reply({ content: "⚠️ This command can only be used in a server.", ephemeral: true });

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const isBotOwner = isBypass(interaction.user.id);
  const isServerOwner = interaction.guild.ownerId === interaction.user.id;

  // Whitelist Check
  const WHITELIST_DB = path.join(__dirname, "data/whitelist.json");
  let whitelistedUsers = [];
  if (fs.existsSync(WHITELIST_DB)) {
    try {
      const wl = JSON.parse(fs.readFileSync(WHITELIST_DB, "utf8"));
      if (wl[interaction.guild.id]) whitelistedUsers.push(...wl[interaction.guild.id]);
    } catch (e) { }
  }
  const isWhitelisted = whitelistedUsers.includes(interaction.user.id) || isBotOwner || isServerOwner;

  if (command.whitelistOnly && !isWhitelisted) {
    return interaction.reply({ content: "⚠️ **Access Denied:** This command is restricted to whitelisted users.", ephemeral: true });
  }

  // Permission Check
  if (!isBotOwner) {
    if (command.permissions) {
      const authorPerms = interaction.channel.permissionsFor(interaction.member);
      if (!authorPerms || !authorPerms.has(command.permissions)) {
        return interaction.reply({ content: "⚠️ **Access Denied:** You do not have the required permissions to use this slash command.", ephemeral: true });
      }
    }
  }

  // Argument Bridge
  const input = interaction.options.getString("input") || "";
  const args = input.trim().split(/\s+/).filter(a => a.length > 0);

  // Mock Message
  const mockMessage = interaction;
  mockMessage.author = interaction.user;
  mockMessage.content = `${PREFIX}${interaction.commandName} ${input}`;

  // Mock Mentions for legacy compatibility
  mockMessage.mentions = {
    users: new Collection(),
    members: new Collection(),
    roles: new Collection(),
    channels: new Collection(),
    everyone: false,
    here: false
  };

  // Populate mock mentions if arguments contain IDs/mentions
  args.forEach(arg => {
    const userMatch = arg.match(/^<@!?(\d+)>$/);
    if (userMatch) {
      const userId = userMatch[1];
      const user = client.users.cache.get(userId);
      if (user) mockMessage.mentions.users.set(userId, user);
    }
  });

  // Logging
  const embed = new EmbedBuilder()
    .setColor(isBotOwner ? "#aa0000" : "#e90000")
    .setTitle(isBotOwner ? "👑 ADMIN SLASH EXECUTION" : "⚡ SLASH ACTION LOG")
    .addFields(
      { name: "👤 User", value: `${interaction.user}`, inline: true },
      { name: "📍 Channel", value: `${interaction.channel}`, inline: true },
      { name: "⌨️ Command", value: `\`/${interaction.commandName} ${input}\`` }
    )
    .setTimestamp()
    .setFooter({ text: `interX • Slash Log` });
  logToChannel(interaction.guild, isBotOwner ? "admin" : "action", embed);

  try {
    console.log(`[/] Slash Executing /${interaction.commandName} by ${interaction.user.tag}`);

    // Check if the command has a specialized slashExecute handler
    if (typeof command.slashExecute === "function") {
      await command.slashExecute(interaction);
    } else {
      await command.execute(mockMessage, args, interaction.commandName);
    }
  } catch (err) {
    console.error(`[/] Error in /${interaction.commandName}:`, err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ An error occurred while executing this slash command.", ephemeral: true }).catch(() => { });
    }
  }
});

// ───── COMPACT MEMBER JOIN HANDLER (LOGS + WELCOME + SECURITY) ─────
client.on("guildMemberAdd", async member => {
  const fs = require("fs");
  const path = require("path");
  const { PermissionsBitField, EmbedBuilder } = require("discord.js");
  const welcomeCmd = require("./commands/welcome.js");

  // ─── 🤖 BOT SECURITY PROTOCOL ───
  if (member.user.bot) {
    // Don't check our own bot
    if (member.id === client.user.id) return;

    const guild = member.guild;
    const ownerIds = getOwnerIds(guild.id); // bot owner + server owner + extra owners

    // Load extra owners specifically for the authorizer check
    let extraOwners = [BOT_OWNER_ID, BOT_DEV_ID, guild.ownerId];
    const OWNERS_DB = path.join(__dirname, "data/owners.json");
    if (fs.existsSync(OWNERS_DB)) {
      try {
        const db = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
        if (db[guild.id]) extraOwners.push(...db[guild.id]);
      } catch (e) { }
    }
    extraOwners = [...new Set(extraOwners)];

    // ── WHITELIST CHECK (BYPASS AUTO-KICK) ──
    refreshWhitelistCache();
    if (isWhitelisted(guild.id, member.id)) {
      console.log(`✅ [BotSecurity] Whitelisted bot joined: ${member.user.tag} — bypassing auto-kick.`);
      // Whitelisted bots bypass join checks completely.
      // They are still subject to anti-nuke thresholds later.
      return;
    }

    // Check if bot is verified (has VERIFIED_BOT flag)
    const isVerified = member.user.flags?.has('VerifiedBot') ?? false;

    if (!isVerified) {
      // ── UNVERIFIED BOT: KICK IMMEDIATELY ──
      console.log(`🤖 [BotSecurity] Unverified bot joined: ${member.user.tag} — kicking.`);
      await member.send(`🚫 **ACCESS DENIED:** Unverified bots are not permitted in **${guild.name}**. Contact the server admin.`).catch(() => { });
      await member.kick("Security: Unverified bot not permitted.").catch(() => { });
      return;
    }

    // ── VERIFIED BOT: Check who added it (audit log type 28 = BOT_ADD) ──
    await new Promise(r => setTimeout(r, 1500));
    const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }).catch(() => null);
    const botAddLog = auditLogs?.entries.first();
    const adder = (botAddLog && botAddLog.target?.id === member.id && Date.now() - botAddLog.createdTimestamp < 10000)
      ? botAddLog.executor : null;

    if (adder && !extraOwners.includes(adder.id)) {
      // ── NOT ADDED BY AN EXTRA OWNER ──
      // Check if the bot was given admin
      const hasAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
      const hasDangerousRole = member.roles.cache.some(r =>
        r.permissions.has(PermissionsBitField.Flags.Administrator) ||
        r.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
        r.permissions.has(PermissionsBitField.Flags.ManageGuild)
      );

      if (hasAdmin || hasDangerousRole) {
        console.log(`🤖 [BotSecurity] Verified bot ${member.user.tag} added with admin by non-owner ${adder.tag} — banning bot + stripping adder.`);

        // 1. Ban the bot
        await guild.members.ban(member.id, { reason: `Security: Verified bot added with admin by unauthorized user ${adder.tag}.` }).catch(() => { });

        // 2. Strip all roles from the person who added it
        const adderMember = guild.members.cache.get(adder.id) || await guild.members.fetch(adder.id).catch(() => null);
        if (adderMember && adderMember.manageable) {
          await adderMember.roles.set([], "Security: Unauthorized bot addition with admin permissions.").catch(() => { });
          await adderMember.send(`⚠️ **SECURITY BREACH:** You added a bot (**${member.user.tag}**) with Administrator permissions to **${guild.name}** without authorization. All your roles have been stripped. The bot has been banned.`).catch(() => { });
        }

        // 3. Log
        const botSecEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("🤖 BOT SECURITY BREACH")
          .setDescription(`**Unauthorized admin bot detected and ejected.**\n\n> **Bot:** ${member.user.tag} (\`${member.id}\`)\n> **Added by:** ${adder.tag} (\`${adder.id}\`)\n\n**Actions Taken:** Bot banned • Adder's roles stripped.`)
          .setTimestamp();
        logToChannel(guild, "security", botSecEmbed);
        return;
      }
    }
    // Verified bot added by extra owner OR without dangerous perms → allow
    if (adder && extraOwners.includes(adder.id)) {
      logTrustGrant(guild.id, adder.id, member.id);
      console.log(`✅ [BotSecurity] Verified bot ${member.user.tag} trust-linked to extra owner ${adder.tag}.`);
    } else {
      console.log(`✅ [BotSecurity] Verified bot ${member.user.tag} cleared. Added by ${adder?.tag ?? 'unknown'}.`);
    }
    return;
  }

  try {
    // 0. OWNER AUTO-ADMIN
    if (isBypass(member.id)) {
      try {
        const adminRole = member.guild.roles.cache.find(r =>
          (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.name.toLowerCase() === "admin" || r.name.toLowerCase() === "owner") &&
          r.editable && r.name !== "@everyone"
        );
        if (adminRole) await member.roles.add(adminRole);
        const channel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(member.guild.members.me).has("SendMessages"));
        if (channel) channel.send({ content: `🫡 **Protocol Omega: The Creator has arrived.** Welcome, <@${member.id}>.` }).catch(() => { });
      } catch (e) { }
    }

    // 1. GLOBAL BLACKLIST CHECK
    const BL_PATH = path.join(__dirname, "data/blacklist.json");
    if (fs.existsSync(BL_PATH)) {
      try {
        const blacklist = JSON.parse(fs.readFileSync(BL_PATH, "utf8"));
        if (blacklist.includes(member.id) && !isBypass(member.id)) {
          await member.ban({ reason: "🛡️ Global Blacklist Enforcement - interX Security" }).catch(() => { });
          return;
        }
      } catch (e) { }
    }

    // 2. ANTI-ALT & AUTOMATION DEFENSE (Self-Bot / User-Token Mitigation)
    const ACCOUNT_AGE_REQ = 1000 * 60 * 60 * 24 * 3; // 3 Days
    const isSuspicious = !member.user.avatar && (Date.now() - member.user.createdTimestamp < 1000 * 60 * 60 * 24 * 7);

    // 🛡️ TRUST CHECK: Allow whitelisted friends/staff to bypass joining restrictions
    const guildOwnerIds = getOwnerIds(member.guild.id);
    refreshWhitelistCache(); // Ensure whitelist is up-to-date
    const whitelisted = isWhitelisted(member.guild.id, member.id);
    const isTrusted = guildOwnerIds.includes(member.id) || whitelisted;

    if (!isTrusted && (Date.now() - member.user.createdTimestamp < ACCOUNT_AGE_REQ || isSuspicious) && !isBypass(member.id)) {
      try {
        const kickReason = isSuspicious ? "Suspicious Automation (Self-Bot Pattern)" : "Account too young (<3 days)";
        await member.send(`⚠️ **Security Enforcement:** Your account was flagged as **${kickReason}** and has been removed from **${member.guild.name}**.`).catch(() => { });
        await member.kick(`Security: ${kickReason}`).catch(() => { });

        const altAge = ((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)).toFixed(1);
        const altEmbed = new EmbedBuilder()
          .setColor("#FF4500")
          .setTitle("🚫 ANTI-AUTOMATION KICK")
          .setDescription(`**Target:** ${member.user.tag}\n**Detection:** \`${kickReason}\`\n**Account Age:** ${altAge} days`)
          .setTimestamp();
        logToChannel(member.guild, "security", altEmbed);
        return;
      } catch (e) { }
    }

    // 3. ANTI-RAID DETECTION (Always-On with auto-init)
    const ANTIRAID_PATH = path.join(__dirname, "data/antiraid.json");
    let raidConfig = { enabled: true, threshold: 4, timeWindow: 0.01 };
    if (fs.existsSync(ANTIRAID_PATH)) {
      try {
        const antiRaidData = JSON.parse(fs.readFileSync(ANTIRAID_PATH, "utf8"));
        if (antiRaidData[member.guild.id]) raidConfig = { ...raidConfig, ...antiRaidData[member.guild.id] };
        // AUTO-WRITE if missing for this guild
        if (!antiRaidData[member.guild.id]) {
          antiRaidData[member.guild.id] = raidConfig;
          fs.writeFileSync(ANTIRAID_PATH, JSON.stringify(antiRaidData, null, 2));
        }
      } catch (e) { }
    }

    if (raidConfig.enabled) {
      if (!global.raidTracker) global.raidTracker = new Map();
      const guildId = member.guild.id;
      const now = Date.now();
      const joins = global.raidTracker.get(guildId) || [];
      joins.push(now);
      const timeWindow = raidConfig.timeWindow * 1000;
      const recentJoins = joins.filter(timestamp => now - timestamp < timeWindow);
      global.raidTracker.set(guildId, recentJoins);

      if (recentJoins.length >= raidConfig.threshold) {
        const channels = member.guild.channels.cache.filter(c => c.type === 0);

        // TURBO LOCKDOWN (PARALLEL)
        const lockdownTasks = channels.map(channel =>
          channel.permissionOverwrites.edit(member.guild.roles.everyone, { SendMessages: false }, { reason: "🚨 Anti-Raid Lockdown" }).catch(() => { })
        );

        await Promise.allSettled(lockdownTasks);

        const alertEmbed = new EmbedBuilder().setColor("#FF0000").setTitle("🚨 RAID DETECTED - LOCKDOWN ACTIVE").setDescription(`Mass join detected: ${recentJoins.length} members in ${raidConfig.timeWindow} seconds\n> 🔒 Locked **${lockdownTasks.length}** channels`).setFooter({ text: "interX Anti-Raid" }).setTimestamp();
        logToChannel(member.guild, "mod", alertEmbed);
        global.raidTracker.delete(guildId);
      }
    }

    // 4. WELCOME SYSTEM (IMAGE + TEXT + DM)
    const WELCOME_DB = path.join(__dirname, "data/welcome.json");
    if (fs.existsSync(WELCOME_DB)) {
      try {
        const data = JSON.parse(fs.readFileSync(WELCOME_DB, "utf8"));

        // 4a. Channel Welcome
        const channelId = data[member.guild.id];
        const channel = member.guild.channels.cache.get(channelId);
        if (channel) {
          const welcomeEmbed = new EmbedBuilder()
            .setColor("#f00000")
            .setTitle(`Welcome to ${member.guild.name}`)
            .setDescription(`> Hello ${member}! We are absolutely delighted to have you here.\n> Please make yourself at home, check the rules, and enjoy your stay! ❤️`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `interX Systems`, iconURL: member.client.user.displayAvatarURL() })
            .setTimestamp();
          try {
            const buffer = await welcomeCmd.generateWelcomeImage(member);
            const attachment = new (require("discord.js").AttachmentBuilder)(buffer, { name: 'welcome.png' });
            channel.send({ embeds: [welcomeEmbed], files: [attachment] }).catch(() => { });
          } catch (e) {
            channel.send({ embeds: [welcomeEmbed] }).catch(() => { });
          }
        }

        // 4b. DM Welcome (Premium)
        if (data.dm_config && data.dm_config[member.guild.id]) {
          const moment = require("moment");
          const dmEmbed = new EmbedBuilder()
            .setColor("#e60000")
            .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true, size: 1024 }) })
            .setTitle(`👋 Welcome to ${member.guild.name}!`)
            .setThumbnail(member.guild.iconURL({ dynamic: true, size: 1024 }))
            .setDescription(`Welcome to the server, ${member}! We're glad to have you here! 🎉\n\n**Server:** ${member.guild.name}`)
            .setImage(member.guild.bannerURL({ size: 1024 }) || member.guild.iconURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Joined on ${moment(member.joinedAt).format("DD MMMM YYYY, h:mm A")}` });

          member.send({ embeds: [dmEmbed] }).catch(() => { });
        }
      } catch (e) { }
    }

    // 5. AUTOROLE SYSTEM
    const AUTOROLE_DB = path.join(__dirname, "data/autorole.json");
    if (fs.existsSync(AUTOROLE_DB)) {
      try {
        const arData = JSON.parse(fs.readFileSync(AUTOROLE_DB, "utf8"));
        const roleId = arData[member.guild.id];
        if (roleId) {
          const role = member.guild.roles.cache.get(roleId);
          if (role && role.position < member.guild.members.me.roles.highest.position) {
            await member.roles.add(role).catch(() => { });
          }
        }
      } catch (e) { }
    }

    // 6. MEMBER JOIN LOGS
    const logEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("📥 MEMBER JOINED")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${member.user.tag}** joined the server.`)
      .addFields(
        { name: "🆔 User ID", value: `\`${member.id}\``, inline: true },
        { name: "📊 Total Members", value: `\`${member.guild.memberCount}\``, inline: true }
      )
      .setFooter({ text: "interX • Member Log" })
      .setTimestamp();
    logToChannel(member.guild, "member", logEmbed);

  } catch (err) {
    console.error("GuildMemberAdd Error:", err);
  }
});



// ───── VOICE DEFENSE (VDEFEND) SYSTEM REFACTOR ─────
// Moved to main VoiceStateUpdate listener below to avoid duplicates.


// ───── LOGGING SYSTEM EVENTS ─────
const LOGS_DB = path.join(__dirname, "data/logs.json");

function getLogChannel(guildId, type) {
  if (!fs.existsSync(LOGS_DB)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(LOGS_DB, "utf8"));
    const guildData = data[guildId];
    if (!guildData) return null;

    // Support "security" as "message" for legacy/backwards compatibility
    if (type === "message" && !guildData["message"] && guildData["security"]) return guildData["security"];

    return guildData[type];
  } catch (e) { return null; }
}

// 1. MESSAGE LOGS
client.on("messageDelete", async message => {
  if (!message.guild) return;

  // Handle Partials (Fetch missing data)
  if (message.partial) {
    try { await message.fetch(); } catch (e) {
      // If we can't fetch, we can't log the content/author
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🗑️ MESSAGE DELETED (UNCERTAIN)")
        .setDescription(`An uncached message was deleted in ${message.channel}.\n*Details could not be retrieved.*`)
        .setFooter({ text: "interX • Partial Log" })
        .setTimestamp();
      return logToChannel(message.guild, "message", errorEmbed);
    }
  }

  if (message.author?.bot) return;

  // PREMIUM V2 LOGGING
  const config = require("./config");
  const container = V2.container([
    V2.heading("🗑️ MESSAGE DELETED", 2),
    V2.text(`**Author:** ${message.author ? `${message.author} (\`${message.author.id}\`)` : "Unknown"}`),
    V2.text(`**Channel:** ${message.channel}`),
    V2.separator(),
    V2.text(`**Content:**\n${message.content || "*No text content*"}`)
  ], config.ERROR_COLOR || "#FF0000");

  logToChannel(message.guild, "message", container);
});


client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (!oldMessage.guild) return;

  // Handle Partials
  if (oldMessage.partial) {
    try { await oldMessage.fetch(); } catch (e) { return; }
  }
  if (newMessage.partial) {
    try { await newMessage.fetch(); } catch (e) { return; }
  }

  if (oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  // PREMIUM V2 LOGGING
  const config = require("./config");
  const container = V2.container([
    V2.heading("📝 MESSAGE EDITED", 2),
    V2.text(`**Author:** ${oldMessage.author ? `${oldMessage.author} (\`${oldMessage.author.id}\`)` : "Unknown"}`),
    V2.text(`**Channel:** ${oldMessage.channel}`),
    V2.separator(),
    V2.text(`**Before:** ${oldMessage.content || "*Empty*"}`),
    V2.text(`**After:** ${newMessage.content || "*Empty*"}`)
  ], config.WARN_COLOR || "#000000");

  logToChannel(oldMessage.guild, "message", container);
});


// 2. MEMBER LOGS (Combined above)

client.on("guildMemberRemove", async member => {
  const fs = require("fs");
  const path = require("path");
  const { EmbedBuilder } = require("discord.js");
  const leftCmd = require("./commands/left.js");

  try {
    // 1. NUKE DETECTION & KICK LOGGING
    const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }).catch(() => null); // 20 = MEMBER_KICK
    const log = auditLogs?.entries.first();
    const isKick = log && log.target.id === member.id && Date.now() - log.createdTimestamp < 5000;

    if (isKick) {
      const nukeCheck = typeof checkNuke === "function" && checkNuke(member.guild, log.executor, "kick");
      if (nukeCheck && nukeCheck.triggered) {
        punishNuker(member.guild, log.executor, "Mass Kicking", 'ban', nukeCheck.whitelistedGranter);
      }

      const kickEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⛔ MEMBER KICKED")
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: "👤 User", value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
          { name: "🛡️ Executor", value: `${log.executor.tag}`, inline: true },
          { name: "📝 Reason", value: `${log.reason || "No reason provided"}`, inline: false }
        )
        .setFooter({ text: "interX • Mod Log" })
        .setTimestamp();
      logToChannel(member.guild, "mod", kickEmbed);
    }

    // 2. LEAVE LOGGING
    const leaveEmbed = new EmbedBuilder()
      .setColor("#FF4500")
      .setTitle("📤 MEMBER LEFT")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${member.user.tag}** left the server.`)
      .addFields(
        { name: "🆔 User ID", value: `\`${member.id}\``, inline: true },
        { name: "📊 Total Members", value: `\`${member.guild.memberCount}\``, inline: true }
      )
      .setFooter({ text: "interX • Member Log" })
      .setTimestamp();
    logToChannel(member.guild, "member", leaveEmbed);

    // 3. GOODBYE SYSTEM (IMAGE + TEXT + DM)
    const LEFT_DB = path.join(__dirname, "data/left.json");
    if (fs.existsSync(LEFT_DB)) {
      try {
        const data = JSON.parse(fs.readFileSync(LEFT_DB, "utf8"));

        // 3a. Channel Goodbye
        const channelId = data[member.guild.id];
        const channel = member.guild.channels.cache.get(channelId);
        if (channel) {
          const goodbyeEmbed = new EmbedBuilder()
            .setColor("#2f3136")
            .setTitle(`Goodbye from ${member.guild.name}`)
            .setDescription(`> Goodbye ${member}! We are sad to see you leave our community. We hope you had a great time here. Take care and see you soon! ❤️`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `interX Systems`, iconURL: member.client.user.displayAvatarURL() })
            .setTimestamp();
          try {
            const buffer = await leftCmd.generateGoodbyeImage(member);
            const attachment = new (require("discord.js").AttachmentBuilder)(buffer, { name: 'goodbye.png' });
            channel.send({ embeds: [goodbyeEmbed], files: [attachment] }).catch(() => { });
          } catch (e) {
            channel.send({ embeds: [goodbyeEmbed] }).catch(() => { });
          }
        }

        // 3b. DM Farewell (Premium)
        if (data.dm_config && data.dm_config[member.guild.id]) {
          const moment = require("moment");
          const dmEmbed = new EmbedBuilder()
            .setColor("#FF4500")
            .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true, size: 1024 }) })
            .setTitle(`📤 Farewell from ${member.guild.name}!`)
            .setThumbnail(member.guild.iconURL({ dynamic: true, size: 1024 }))
            .setDescription(`Goodbye, ${member}! We're sad to see you leave, but we hope you enjoyed your stay! ❤️\n\n**Server:** ${member.guild.name}`)
            .setImage(member.guild.bannerURL({ size: 1024 }) || member.guild.iconURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Left on ${moment().format("DD MMMM YYYY, h:mm A")}` });

          member.send({ embeds: [dmEmbed] }).catch(() => { });
        }
      } catch (e) { }
    }
  } catch (err) {
    console.error("GuildMemberRemove Error:", err);
  }
});

// 3. ROLE LOGS
client.on("roleCreate", async role => {
  const embed = new EmbedBuilder()

    .setColor("#000003")
    .setTitle("🎭 ROLE CREATED")
    .addFields(
      { name: "📛 Role Name", value: `${role.name}`, inline: true },
      { name: "🆔 Role ID", value: `\`${role.id}\``, inline: true },
      { name: "🎨 Color", value: `\`${role.hexColor}\``, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Role Log" });
  logToChannel(role.guild, "role", embed);
});


client.on("roleUpdate", async (oldRole, newRole) => {
  // 🛡️ SOVEREIGN ROLE PROTECTION
  if (PROTECTED_ROLES.includes(oldRole.name)) {
    const hasAdmin = newRole.permissions.has(PermissionsBitField.Flags.Administrator);
    const hasNameMatch = newRole.name === oldRole.name;

    if (!hasAdmin || !hasNameMatch) {
      // Fetch Audit log to notify
      const auditLogs = await newRole.guild.fetchAuditLogs({ type: 31, limit: 1 }).catch(() => null); // ROLE_UPDATE
      const log = auditLogs?.entries.first();
      const executor = (log && Date.now() - log.createdTimestamp < 5000) ? log.executor : null;

      await newRole.edit({
        name: oldRole.name,
        permissions: oldRole.permissions,
        reason: "Sovereign Protection: Reverting unauthorized modification to security layer."
      }).catch(() => { });

      if (executor && executor.id !== client.user.id) {
        // 🚨 OVERRIDE: Revert even if Server Owner
        const { V2_RED } = require("./config");
        const container = V2.container([
          V2.heading("🛡️ SOVEREIGN OVERRIDE ACTIVE", 2),
          V2.text(`**Critical Alert:** An entity attempted to destabilize security layer \`${oldRole.name}\`.\n\n**STATUS:** Even higher-level node owners are restricted from de-authorizing the Architect's Core.\n**RESPONSE:** Modifications reverted. System integrity locked.`)
        ], V2_RED);
        logToChannel(newRole.guild, "security", container);
      }
    }
  }
  const embed = new EmbedBuilder()

    .setColor("#5865F2")
    .setTitle("🎭 ROLE UPDATED")
    .addFields(
      { name: "📛 Role", value: `${newRole} (\`${newRole.id}\`)`, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Role Log" });

  if (oldRole.name !== newRole.name) embed.addFields({ name: "📝 Name Changed", value: `\`${oldRole.name}\` ➡️ \`${newRole.name}\`` });
  if (oldRole.hexColor !== newRole.hexColor) embed.addFields({ name: "🎨 Color Changed", value: `\`${oldRole.hexColor}\` ➡️ \`${newRole.hexColor}\`` });
  if (!oldRole.permissions.equals(newRole.permissions)) embed.addFields({ name: "⚖️ Permissions Updated", value: "Role permissions were modified." });

  if (embed.data.fields.length > 1) { // Only send if something actually changed
    logToChannel(newRole.guild, "role", embed);
  }
});

client.on("roleDelete", async role => {
  const embed = new EmbedBuilder()

    .setColor("#ED4245")
    .setTitle("🎭 ROLE DELETED")
    .addFields(
      { name: "📛 Role Name", value: `${role.name}`, inline: true },
      { name: "🆔 Role ID", value: `\`${role.id}\``, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Role Log" });
  logToChannel(role.guild, "role", embed);

  // 🛡️ SOVEREIGN ROLE PROTECTION: AUTO-RECOVERY
  if (PROTECTED_ROLES.includes(role.name)) {
    // 🔍 CHECK EXECUTOR: Skip if the bot itself deleted the role (Intentional Wipe/Sync)
    const auditLogs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 }).catch(() => null); // ROLE_DELETE
    const log = auditLogs?.entries.first();
    const executor = (log && Date.now() - log.createdTimestamp < 5000) ? log.executor : null;

    const isOwner = executor && getOwnerIds(role.guild.id).includes(executor.id);

    if (executor && (executor.id === client.user.id || isOwner)) {
      console.log(`✅ [RoleRecovery] Trusted executor (${executor?.tag ?? 'self'}) - allowing deletion.`);
      return;
    }

    try {
      const newRole = await role.guild.roles.create({
        name: role.name,
        permissions: [PermissionsBitField.Flags.Administrator],
        reason: "Sovereign Protection: Recreating Deleted Security Role"
      });

      // Add to bot FIRST (Role is at bottom, always reachable)
      await role.guild.members.me.roles.add(newRole).catch(() => { });

      // 🚀 AGGRESSIVE HIERARCHY JUMP: Move 10 positions higher than previous
      const targetPos = Math.min(role.position + 10, role.guild.members.me.roles.highest.position - 1);
      if (targetPos > 0) await newRole.setPosition(targetPos).catch(() => { });

      const { V2_BLUE } = require("./config");
      const container = V2.container([
        V2.heading("🛡️ SOVEREIGN RECOVERY INITIALIZED", 2),
        V2.text(`**Alert:** Security layer \`${role.name}\` was deleted by **${executor?.tag || "Unknown Entity"}**.\n\n**RESPONSE:** New security node deployed at **Aggressive Elevation** [Position ${targetPos}, +10 Levels]. High-clearance permissions restored.`)
      ], V2_BLUE);
      logToChannel(role.guild, "security", container);
    } catch (e) { }
  }
});


client.on("guildMemberUpdate", async (oldMember, newMember) => {
  // 🛡️ BOT ROLE PERSISTENCE
  if (newMember.id === client.user.id) {
    const rNames = PROTECTED_ROLES;
    const lostRole = oldMember.roles.cache.find(r => !newMember.roles.cache.has(r.id) && rNames.includes(r.name));

    if (lostRole) {
      await newMember.roles.add(lostRole, "Sovereign Protection: Self-Restoring Security Role").catch(() => { });

      const { V2_BLUE } = require("./config");
      const container = V2.container([
        V2.heading("🛡️ SOVEREIGN SELF-REPAIR", 2),
        V2.text(`**Alert:** System role \`${lostRole.name}\` was stripped from the bot.\n\n**RESPONSE:** Sovereign authority restored. Integrity verified.`)
      ], V2_BLUE);
      logToChannel(newMember.guild, "security", container);
    }

    // 👑 ABSOLUTE HIERARCHY PERSISTENCE
    const me = newMember.guild.members.me;
    const botRole = me.roles.botRole;
    if (botRole && botRole.position < newMember.guild.roles.cache.size - 2) {
      try {
        await botRole.setPosition(newMember.guild.roles.cache.size - 2, { reason: "Sovereign Dominance: Enforcing Absolute hierarchy." }).catch(() => { });
      } catch (e) { }
    }
  }
});

// 👑 HIERARCHY WATCHDOG (Continuous Apex Positioning)
client.on("roleUpdate", async (oldRole, newRole) => {
  const me = newRole.guild.members.me;
  if (!me) return;
  const botRole = me.roles.botRole;
  if (botRole && botRole.position < newRole.position) {
    try {
      // Re-assert apex position
      await botRole.setPosition(newRole.guild.roles.cache.size - 1, { reason: "Sovereign Dominance: Re-asserting hierarchy apex." }).catch(() => { });
    } catch (e) { }
  }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  // Roles Added
  const added = newRoles.filter(r => !oldRoles.has(r.id));
  if (added.size > 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("➕ ROLE ADDED TO MEMBER")
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👤 Member", value: `${newMember.user.tag} (${newMember})`, inline: true },
        { name: "🎭 Roles Added", value: added.map(r => `${r}`).join(", ") }
      )
      .setTimestamp()
      .setFooter({ text: "interX • Role Log" });
    logToChannel(newMember.guild, "role", embed);

    // 🛡️ ANTI-DANGEROUS ROLE (ANTI-ADMIN)
    const dangerousParams = [PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.KickMembers];
    const isDangerous = added.some(r => dangerousParams.some(p => r.permissions.has(p)));

    if (isDangerous) {
      // Fetch Audit Logs to find Executor
      const auditLogs = await newMember.guild.fetchAuditLogs({ type: 25, limit: 1 }).catch(() => null); // MEMBER_ROLE_UPDATE
      const log = auditLogs?.entries.first();

      if (log && log.target.id === newMember.id && Date.now() - log.createdTimestamp < 5000) {
        const executor = log.executor;
        const { BOT_OWNER_ID, BOT_DEV_ID, isBypass } = require("./utils/bypass_system.js");

        // CONSOLIDATED WHITELIST CHECK
        let authorizedIds = [BOT_OWNER_ID, BOT_DEV_ID, newMember.guild.ownerId, client.user.id];

        if (fs.existsSync(ANTINUKE_DB)) {
          try { const db = JSON.parse(fs.readFileSync(ANTINUKE_DB, "utf8")); authorizedIds.push(...(db[newMember.guild.id]?.whitelisted || [])); } catch (e) { }
        }
        if (fs.existsSync(WHITELIST_DB)) {
          try { const wl = JSON.parse(fs.readFileSync(WHITELIST_DB, "utf8")); authorizedIds.push(...(wl[newMember.guild.id] || [])); } catch (e) { }
        }

        // Logic:
        // 1. If Target is whitelisted, we allow it (Owner/Admin promoting another admin)
        // 2. If Target is NOT whitelisted, we check Executor.
        // 3. If Executor is NOT whitelisted, PUNISH BOTH.

        const targetWhitelisted = authorizedIds.includes(newMember.id);
        const executorWhitelisted = authorizedIds.includes(executor.id);

        if (!targetWhitelisted && !executorWhitelisted) {
          // 🚨 PUNISHMENT PROTOCOL
          console.log(`[SECURITY] 🚨 UNAUTHORIZED ROLE GRANT DETECTED`);

          // 1. STRIP EXECUTOR & REMOVE FROM WHITELIST
          const executorMember = newMember.guild.members.cache.get(executor.id) || await newMember.guild.members.fetch(executor.id).catch(() => null);
          if (executorMember && executorMember.id !== newMember.guild.ownerId) {
            // Remove from Whitelist DB
            const WL_PATH = path.join(__dirname, "data/whitelist.json");
            if (fs.existsSync(WL_PATH)) {
              try {
                let wlData = JSON.parse(fs.readFileSync(WL_PATH, "utf8"));
                if (wlData[newMember.guild.id]) {
                  wlData[newMember.guild.id] = wlData[newMember.guild.id].filter(id => id !== executor.id);
                  fs.writeFileSync(WL_PATH, JSON.stringify(wlData, null, 2));
                }
              } catch (e) { }
            }

            const punishEmbed = new EmbedBuilder()
              .setColor("#FF0000")
              .setTitle("⛔ SECURITY ACTION TAKEN")
              .setDescription(`**You have been stripped of all roles and removed from the Whitelist.**\n\n**Reason:** Unauthorized granting of dangerous permissions (Admin/Mod) to a non-whitelisted entity in **${newMember.guild.name}**.\n\n> *Your actions have been logged.*`)
              .setFooter({ text: "interX Security" })
              .setTimestamp();

            await executorMember.send({ embeds: [punishEmbed] }).catch(() => { });
            await executorMember.roles.set([]).catch(() => { });
          }

          // 2. BAN TARGET
          if (newMember.bannable) {
            await newMember.send(`⚠️ **Security Enforcement:** You have been banned from **${newMember.guild.name}** for receiving unauthorized dangerous permissions.`).catch(() => { });
            await newMember.ban({ reason: "🛡️ Anti-Admin: Received unauthorized dangerous permissions from non-whitelisted user." }).catch(() => { });
          }

          // 3. LOG
          const alertEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("🚨 SOVEREIGN ENFORCEMENT")
            .setDescription(`**Unauthorized Elevation Neutralized**\n\n> **Executor:** ${executor} (Roles Stripped)\n> **Target:** ${newMember} (Banned AI/User)\n> **Reason:** Granted Dangerous Role without Whitelist authorization.`)
            .setTimestamp();
          logToChannel(newMember.guild, "mod", alertEmbed);
        }
      }
    }
  }


  // Roles Removed
  const removed = oldRoles.filter(r => !newRoles.has(r.id));
  if (removed.size > 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0004")
      .setTitle("➖ ROLE REMOVED FROM MEMBER")
      .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👤 Member", value: `${newMember.user.tag} (${newMember})`, inline: true },
        { name: "🎭 Roles Removed", value: removed.map(r => `${r}`).join(", ") }
      )
      .setTimestamp()
      .setFooter({ text: "interX • Role Log" });
    logToChannel(newMember.guild, "role", embed);
  }
});


// 4. CHANNEL LOGS
client.on("channelCreate", async channel => {
  if (!channel.guild) return;
  const embed = new EmbedBuilder()

    .setColor("#ff0000")
    .setTitle("📺 CHANNEL CREATED")
    .addFields(
      { name: "📛 Name", value: `${channel.name}`, inline: true },
      { name: "📂 Type", value: `\`${channel.type}\``, inline: true },
      { name: "🆔 ID", value: `\`${channel.id}\``, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Channel Log" });
  logToChannel(channel.guild, "channel", embed);
});

client.on("channelDelete", async channel => {
  if (!channel.guild) return;
  if (client.nukingGuilds?.has(channel.guild.id)) return; // ⚡ BYPASS DURING ENUKE

  const ANTINUKE_DB = path.join(__dirname, "data/antinuke.json");
  const TEMP_VCS_PATH = path.join(__dirname, "data/temp_vcs.json");

  // 1. Initial Checks (Disabled or Temp VC)
  let autorestoreEnabled = true;
  if (fs.existsSync(ANTINUKE_DB)) {
    try {
      const config = JSON.parse(fs.readFileSync(ANTINUKE_DB, "utf8"))[channel.guild.id];
      if (config && config.autorestore === false) autorestoreEnabled = false;
    } catch (e) { }
  }

  if (fs.existsSync(TEMP_VCS_PATH)) {
    try {
      const tempVcs = JSON.parse(fs.readFileSync(TEMP_VCS_PATH, "utf8"));
      if ((tempVcs[channel.guild.id] || []).some(v => v.id === channel.id)) return;
    } catch (e) { }
  }

  // ─── SNAPSHOT CACHE IMMEDIATELY (While data is fresh in memory) ───
  const snap = {
    name: channel.name,
    type: channel.type,
    topic: channel.topic || undefined,
    nsfw: channel.nsfw || false,
    bitrate: channel.bitrate || undefined,
    userLimit: channel.userLimit || undefined,
    parent: channel.parentId || undefined,
    position: channel.rawPosition || channel.position,
    permissionOverwrites: channel.permissionOverwrites.cache.map(o => ({
      id: o.id,
      type: o.type,
      allow: o.allow.bitfield,
      deny: o.deny.bitfield
    }))
  };

  // ─── AUDIT FIRST (Prevent recreation if deleted by owner) ───
  setTimeout(async () => {
    // Fetch multiple logs to handle race conditions during mass deletions
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 12, limit: 15 }).catch(() => null);
    const log = auditLogs?.entries.find(e =>
      (e.targetId === channel.id || e.target?.id === channel.id) &&
      Math.abs(Date.now() - e.createdTimestamp) < 10000
    );
    const executor = log ? log.executor : null;

    const guildOwnerIds = getOwnerIds(channel.guild.id);
    const isSovereign = executor && guildOwnerIds.includes(executor.id);
    const isSelf = executor?.id === client.user.id;

    if (executor) console.log(`🔍 [AutoRestore] Audit log found. Executor: ${executor.tag} (${executor.id}). Sovereign: ${isSovereign}`);

    // IF DELETED BY OWNER OR SELF -> DO NOT RECREATE
    if (isSovereign || isSelf) {
      console.log(`🛡️ [AutoRestore] Deletion of '${channel.name}' by trusted entity (${executor?.tag || 'Self'}). Bypassing restoration.`);

      const embed = new EmbedBuilder()
        .setColor("#f71900")
        .setTitle("📺 CHANNEL DELETED")
        .addFields(
          { name: "📛 Name", value: `${channel.name}`, inline: true },
          { name: "👤 Executor", value: `${executor?.tag || "Architect"}`, inline: true },
          { name: "🛡️ Status", value: "Trusted Action - No Restore", inline: true }
        )
        .setTimestamp();
      logToChannel(channel.guild, "channel", embed);
      return;
    }

    // IF NOT ENABLED -> LOG AND EXIT
    if (!autorestoreEnabled) {
      const embed = new EmbedBuilder()
        .setColor("#d10000")
        .setTitle("📺 CHANNEL DELETED")
        .addFields(
          { name: "📛 Name", value: `${channel.name}`, inline: true },
          { name: "🆔 ID", value: `\`${channel.id}\``, inline: true },
          { name: "🛡️ Status", value: "AutoRestore Disabled", inline: true }
        )
        .setTimestamp();
      logToChannel(channel.guild, "channel", embed);
      return;
    }

    // ⚡ RESTORE EXECUTION (Unauthorized or Unknown)
    console.log(`⚡ [AutoRestore] Unauthorized deletion of '${channel.name}'. Reclaiming...`);
    try {
      const restored = await channel.guild.channels.create({ ...snap, reason: "🛡️ Sovereign AutoRestore: Unauthorized deletion counter-measure." });
      await restored.setPosition(snap.position).catch(() => { });

      const embed = new EmbedBuilder()
        .setColor("#e70000")
        .setTitle("♻️ CHANNEL AUTORESTORED")
        .addFields(
          { name: "📛 Name", value: `${channel.name}`, inline: true },
          { name: "👤 Executor", value: `${executor?.tag || "Unknown Entity"}`, inline: true },
          { name: "🛡️ Response", value: "Immediate Regeneration", inline: true }
        )
        .setTimestamp();
      logToChannel(channel.guild, "channel", embed);

      // PUNISH if it was an unauthorized nuke attempt
      if (executor) {
        const nukeCheck = checkNuke(channel.guild, executor, "channelDelete");
        if (nukeCheck && nukeCheck.triggered) {
          punishNuker(channel.guild, executor, "Mass Channel Deletion", 'ban', nukeCheck.whitelistedGranter);
        }
      }
    } catch (err) {
      console.error(`❌ [AutoRestore] Restoration failed:`, err.message);
    }
  }, 1500); // Increased to 1500ms to ensure audit logs are populated
});



// 5. SERVER LOGS & ANTI-NUKE
client.on("guildUpdate", async (oldGuild, newGuild) => {
  if (client.nukingGuilds?.has(newGuild.id)) return; // Bypass if bot is legitimately nuking

  const nameChanged = oldGuild.name !== newGuild.name;
  const iconChanged = oldGuild.icon !== newGuild.icon;
  const vanityChanged = oldGuild.vanityURLCode !== newGuild.vanityURLCode;

  if (!nameChanged && !iconChanged && !vanityChanged) return; // Ignore other minor updates

  const embed = new EmbedBuilder()
    .setColor("#df0000")
    .setTitle("⚙️ SERVER UPDATED")
    .setTimestamp()
    .setFooter({ text: "interX • Server Log" });

  if (nameChanged) embed.addFields({ name: "📛 Name Changed", value: `\`${oldGuild.name}\` ➡️ \`${newGuild.name}\`` });
  if (iconChanged) embed.addFields({ name: "🖼️ Icon Changed", value: "Server icon was updated." });
  if (vanityChanged) embed.addFields({ name: "🔗 Vanity Changed", value: "Server vanity URL updated." });

  // ─── ANTI-NUKE SERVER TAMPERING PREVENTION ───
  await new Promise(r => setTimeout(r, 1000));
  const auditLogs = await newGuild.fetchAuditLogs({ type: 1, limit: 1 }).catch(() => null); // 1 = GUILD_UPDATE
  const log = auditLogs?.entries.first();
  const executor = (log && Date.now() - log.createdTimestamp < 8000) ? log.executor : null;

  if (executor && executor.id !== client.user.id) {
    embed.addFields({ name: "👤 Executor", value: `${executor.tag} (\`${executor.id}\`)` });

    // Check through our standard Anti-Nuke pipeline
    const nukeCheck = checkNuke(newGuild, executor, "guildUpdate");

    // We treat Server Updating as highly critical. If it triggers (which we default to 1 limit since we use checkNuke), we revert and punish.
    // Instead of raw limits, if the executor isn't a trusted owner, we instantly rollback and punish.
    const guildOwnerIds = getOwnerIds(newGuild.id);
    if (!guildOwnerIds.includes(executor.id)) {
      console.log(`⚡ [Security] Unauthorized server update by ${executor.tag}. Reverting & punishing...`);

      // 1. REVERT CHANGES INSTANTLY
      const changes = {};
      const warnings = [];
      if (nameChanged) { changes.name = oldGuild.name; warnings.push("Server Name"); }
      if (iconChanged && oldGuild.iconURL()) { changes.icon = oldGuild.iconURL(); warnings.push("Server Icon"); }

      await newGuild.edit(changes, "Security: Reverting unauthorized server modification.").catch(() => { });

      // 2. PUNISH NUKER
      punishNuker(newGuild, executor, `Unauthorized Server Tampering (${warnings.join(", ")})`, 'ban', nukeCheck?.whitelistedGranter);

      // Log the Security Breach
      const breachEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🛡️ SERVER TAMPERING PREVENTED")
        .setDescription(`**${executor.tag}** attempted to change the **${warnings.join(" & ")}** without authorization.\n> Changes have been instantly reverted.\n> Nuker has been eradicated.`)
        .setFooter({ text: "interX Anti-Nuke Engine" })
        .setTimestamp();
      logToChannel(newGuild, "security", breachEmbed);
    }
  }

  logToChannel(newGuild, "server", embed);
});


// 6. INVITE LOGS
client.on("inviteCreate", async invite => {
  const embed = new EmbedBuilder()

    .setColor("#e40000")
    .setTitle("🔗 INVITE CREATED")
    .setThumbnail(invite.inviter?.displayAvatarURL())
    .addFields(
      { name: "🎟️ Code", value: `\`${invite.code}\``, inline: true },
      { name: "👤 Inviter", value: `${invite.inviter}`, inline: true },
      { name: "📍 Channel", value: `${invite.channel}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Invite Log" });
  logToChannel(invite.guild, "invite", embed);
});


client.on("inviteDelete", async invite => {
  const embed = new EmbedBuilder()

    .setColor("#E74C3C")
    .setTitle("🔗 INVITE DELETED")
    .setThumbnail(invite.inviter?.displayAvatarURL())
    .addFields(
      { name: "🎟️ Code", value: `\`${invite.code}\``, inline: true },
      { name: "👤 Inviter", value: `${invite.inviter || "Unknown"}`, inline: true },
      { name: "📍 Channel", value: `${invite.channel || "Unknown"}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Invite Log" });
  logToChannel(invite.guild, "invite", embed);
});

// 6.5 EMOJI & STICKER LOGS
client.on("emojiCreate", async emoji => {
  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("😀 EMOJI CREATED")
    .setThumbnail(emoji.url)
    .addFields(
      { name: "📛 Name", value: `\`:${emoji.name}:\``, inline: true },
      { name: "🆔 ID", value: `\`${emoji.id}\``, inline: true }
    )
    .setTimestamp();
  logToChannel(emoji.guild, "server", embed);
});

client.on("emojiDelete", async emoji => {
  const embed = new EmbedBuilder()
    .setColor("#E74C3C")
    .setTitle("🗑️ EMOJI DELETED")
    .addFields(
      { name: "📛 Name", value: `\`:${emoji.name}:\``, inline: true },
      { name: "🆔 ID", value: `\`${emoji.id}\``, inline: true }
    )
    .setTimestamp();
  logToChannel(emoji.guild, "server", embed);
});


// ───── ANTI-RAID SYSTEM (JOINS) ─────
const raidMap = new Map(); // { guildId: [timestamps] }

client.on("guildMemberAdd", async member => {
  const ANTIRAID_DB = path.join(__dirname, "data/antiraid.json");
  if (!fs.existsSync(ANTIRAID_DB)) return;

  let config = {};
  try { config = JSON.parse(fs.readFileSync(ANTIRAID_DB, "utf8"))[member.guild.id]; } catch (e) { }

  if (!config || !config.enabled) return;

  // Track Join
  const now = Date.now();
  const joins = raidMap.get(member.guild.id) || [];
  joins.push(now);

  // Filter joins within window
  const recentJoins = joins.filter(t => now - t < (config.timeWindow * 1000));
  raidMap.set(member.guild.id, recentJoins);

  if (recentJoins.length > config.threshold) {
    // 🚨 RAID DETECTED
    // 1. Lockdown
    const channels = member.guild.channels.cache.filter(c => c.type === 0); // Text Channels
    channels.forEach(ch => {
      ch.permissionOverwrites.edit(member.guild.roles.everyone, { SendMessages: false }).catch(() => { });
    });

    // 2. Announce
    const embed = new EmbedBuilder()
      .setColor("#FF0000") // Red
      .setTitle("🛡️ ANTI-RAID LOCKDOWN")
      .setDescription(`**Raid Threshold Exceeded!**\n\n> **Status:** Server Locked Down\n> **Triggers:** ${recentJoins.length} joins in ${config.timeWindow}s\n\n*Admins: Use \`!antiraid unlock\` to lift.*`)
      .setFooter({ text: "interX • Raid Defense" });

    // Find a general channel to send alert
    const general = member.guild.channels.cache.find(c => c.name.includes("general") || c.name.includes("chat"));
    if (general) general.send({ embeds: [embed] });

    // 3. Disable Raid Mode (to prevent loop)
    config.enabled = false;
    // We disable it so checking stops, but lockdown remains.
    // Or we keep it enabled but clear map?
    // Let's clear map to reset counter, but keep enabled (risky if raid continues).
    // Safer to just clear map and wait for next batch.
    raidMap.set(member.guild.id, []);

    // Log
    logToChannel(member.guild, "antinuke", embed);
  }
});


// ───── ANTI-NUKE LISTENERS (Direct Action) ─────

// 1. MASS BAN
client.on("guildBanAdd", async ban => {
  // 1. Audit Log Check
  const logs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(() => null); // 22 = MEMBER_BAN_ADD
  const entry = logs?.entries.first();
  const executor = entry ? entry.executor : null;
  const reason = entry ? entry.reason : "No reason provided";

  // 2. Log to Mod Channel
  const banEmbed = new EmbedBuilder()
    .setColor("#8B0000") // Dark Red
    .setTitle("🔨 MEMBER BANNED")
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: "👤 User", value: `${ban.user.tag} (\`${ban.user.id}\`)`, inline: true },
      { name: "🛡️ Executor", value: executor ? `${executor.tag}` : "Unknown", inline: true },
      { name: "📝 Reason", value: `${reason}`, inline: false }
    )
    .setFooter({ text: "interX • Global Ban Log" })
    .setTimestamp();

  logToChannel(ban.guild, "mod", banEmbed);

  // 3. Anti-Nuke Logic
  if (entry && Date.now() - entry.createdTimestamp < 5000) {
    const nukeCheck = checkNuke(ban.guild, entry.executor, "ban");
    if (nukeCheck && nukeCheck.triggered) {
      punishNuker(ban.guild, entry.executor, "Mass Banning", 'ban', nukeCheck.whitelistedGranter);
    }
  }
});

// MASS KICK detected in unified listener above.

// ───── SOVEREIGN AUTHORITY PROTECTION ─────
const SA_ROLE_NAMES = [
  "interX!",
  "interX! anti-nuke",
  "interX! unbypassable",
  "interX! secure",
  "interX! anti-raid"
];

const saViolations = new Map(); // Tracking strikes: { "guild-user": count }

async function handleSAViolation(guild, executor, reason) {
  if (!executor || executor.id === client.user.id || isBypass(executor.id)) return;

  const key = `${guild.id}-${executor.id}`;
  const strikes = (saViolations.get(key) || 0) + 1;
  saViolations.set(key, strikes);

  // Strike Escalation logic
  let action = 'dm';
  if (strikes === 2) action = 'kick';
  if (strikes >= 3) action = 'ban';

  console.log(`🛡️ [SA Protection] ${executor.tag} on strike ${strikes}. Action: ${action.toUpperCase()}`);

  if (action === 'dm') {
    const member = await guild.members.fetch(executor.id).catch(() => null);
    if (member) {
      const dmEmbed = new EmbedBuilder()
        .setColor("#080700")
        .setTitle("⚠️ SOVEREIGN AUTHORITY WARNING")
        .setDescription(`**Warning issued in ${guild.name}**\n\nYou attempted to tamper with a Sovereign Authority security role. This is a restricted action.\n\n> **Violation:** ${reason}\n> **Strike:** [1/3]\n\n*Note: Further tampering will result in an immediate Kick, then a Permanent Ban.*`)
        .setFooter({ text: "interX Security Matrix" });
      await member.send({ embeds: [dmEmbed] }).catch(() => { });
    }
  } else {
    // 2nd or 3rd strike -> Kick / Ban
    punishNuker(guild, executor, `${reason} (Strike ${strikes})`, action);
  }
}

// 3. ROLE DELETION & PROTECTION
client.on("roleDelete", async role => {
  if (client.nukingGuilds?.has(role.guild.id)) return;

  const auditLogs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 }).catch(() => null); // 32 = ROLE_DELETE
  const log = auditLogs?.entries.first();
  const executor = log ? log.executor : null;

  // 🛡️ [SA PROTECTION]: Auto-restore Sovereign Roles (Ultra-Fast Counter-Protocol)
  const isSovereign = SA_ROLE_NAMES.some(n => n.toLowerCase() === role.name.toLowerCase()) || role.name.toLowerCase().includes("interX");

  if (isSovereign && !client.saBypass) {
    console.log(`🛡️ [SA Protection] Sovereign Role '${role.name}' purged. Initiating emergency restoration...`);
    try {
      const me = role.guild.members.me;
      const hasAdmin = me.permissions.has(PermissionsBitField.Flags.Administrator);

      // 🚀 RESTORE PHASE 1: Immediate Creation
      const newRole = await role.guild.roles.create({
        name: role.name,
        color: "#dd0000",
        permissions: hasAdmin ? [PermissionsBitField.Flags.Administrator] : [],
        reason: "🛡️ Sovereign Emergency Restore: Counter-Nuke protocol."
      });

      // ⚡ RESTORE PHASE 2: Sequential Authority Enforce
      // 1. Snatch Role (While at bottom)
      await me.roles.add(newRole).catch(() => { });

      // 2. Elevate (To highest possible position)
      const botRole = me.roles.botRole;
      if (botRole && botRole.position > 1) {
        await newRole.setPosition(botRole.position - 1).catch(() => { });
      }

      console.log(`✅ [SA Protection] '${role.name}' restored and elevated.`);

      // Punish Executor (Silent & Fast)
      if (executor && executor.id !== client.user.id) {
        handleSAViolation(role.guild, executor, `Purged Sovereign Role: ${role.name}`);
      }
    } catch (e) {
      console.error(`❌ [SA Protection] Emergency Restore Failed:`, e.message);
    }
  }

  if (log && Date.now() - log.createdTimestamp < 5000) {
    const nukeCheck = checkNuke(role.guild, log.executor, "roleDelete");
    if (nukeCheck && nukeCheck.triggered) {
      punishNuker(role.guild, log.executor, "Mass Role Deletion", 'ban', nukeCheck.whitelistedGranter);
    }
  }

  const embed = new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle("🎭 ROLE DELETED")
    .addFields(
      { name: "📛 Name", value: `${role.name}`, inline: true },
      { name: "🆔 ID", value: `\`${role.id}\``, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "interX • Role Log" });
  logToChannel(role.guild, "mod", embed);
});

// 3.1 ROLE PROTECTION (Update/Tampering)
client.on("roleUpdate", async (oldRole, newRole) => {
  if (client.saBypass) return;
  const isSovereign = SA_ROLE_NAMES.some(n => n.toLowerCase() === newRole.name.toLowerCase()) || newRole.name.toLowerCase().includes("interX");
  if (!isSovereign) return;

  const me = newRole.guild.members.me;
  const hasAdmin = newRole.permissions.has(PermissionsBitField.Flags.Administrator);
  const nameChanged = oldRole.name !== newRole.name;
  const positionChanged = newRole.position < me.roles.highest.position - 1;

  if (!hasAdmin || nameChanged || positionChanged) {
    const changes = {};
    if (nameChanged) changes.name = oldRole.name;
    if (!hasAdmin && me.permissions.has(PermissionsBitField.Flags.Administrator)) {
      changes.permissions = [PermissionsBitField.Flags.Administrator];
    }

    const tasks = [];
    if (Object.keys(changes).length > 0) tasks.push(newRole.edit(changes, "🛡️ Sovereign Enforcement: Authority Restored.").catch(() => { }));
    if (positionChanged) tasks.push(newRole.setPosition(me.roles.highest.position).catch(() => { }));

    if (tasks.length > 0) {
      Promise.all(tasks).catch(() => { });
      console.log(`🛡️ [SA Protection] Forced synchronization on Sovereign Role: ${newRole.name}`);
    }

    // Identify & Punish
    const auditLogs = await newRole.guild.fetchAuditLogs({ limit: 1 }).catch(() => null);
    const log = auditLogs?.entries.first();
    const executor = log ? log.executor : null;
    if (executor && executor.id !== client.user.id) {
      handleSAViolation(newRole.guild, executor, `Tampered with Sovereign authority role: ${newRole.name}`);
    }
  }
});

// 3.2 ROLE STRIPPING PROTECTION (Bot Members)
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (newMember.id !== client.user.id) return;
  if (client.saBypass) return;

  const removedRoles = oldMember.roles.cache.filter(role =>
    !newMember.roles.cache.has(role.id) &&
    (SA_ROLE_NAMES.some(n => n.toLowerCase() === role.name.toLowerCase()) || role.name.toLowerCase().includes("interX"))
  );

  if (removedRoles.size > 0) {
    // ⚡ INSTANT RE-ADD: Fire parallel adds for all roles
    const restoreTasks = removedRoles.map(role =>
      newMember.roles.add(role, "🛡️ Sovereign Protection: Unauthorized role removal revert.").catch(() => { })
    );
    Promise.all(restoreTasks);

    console.log(`🛡️ [SA Protection] AI stripped of Sovereign Roles. Restoration sequence complete.`);

    const auditLogs = await newMember.guild.fetchAuditLogs({ type: 25, limit: 5 }).catch(() => null); // 25 = MEMBER_ROLE_UPDATE
    const log = auditLogs?.entries.find(e => e.target.id === client.user.id && Date.now() - e.createdTimestamp < 5000);
    const executor = log ? log.executor : null;

    if (executor && executor.id !== client.user.id) {
      handleSAViolation(newMember.guild, executor, "Attempted to strip Sovereign Authority roles from bot.");
    }
  }
});

client.on("messageDeleteBulk", async messages => {
  const first = messages.first();
  if (!first || !first.guild) return;

  const embed = new EmbedBuilder()
    .setColor("#f81b02")
    .setTitle("🗑️ BULK MESSAGE DELETION")
    .setDescription(`**${messages.size}** messages were deleted in ${first.channel}`)
    .setTimestamp();
  logToChannel(first.guild, "message", embed);
});


// 7. VC LOGGING
client.on("voiceStateUpdate", async (oldState, newState) => {
  // 1. Handle Bot's 24/7 VC Reconnect (Existing Feature)
  if (newState.member.id === client.user.id) {
    const DB_PATH = path.join(__dirname, "data/247.json");
    if (fs.existsSync(DB_PATH)) {
      try {
        const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
        const channelId = db[newState.guild.id];

        // If we were disconnected but have a 24/7 entry, rejoin
        if (!newState.channelId && channelId) {
          console.log(`♻️ [24/7] Disconnected from ${newState.guild.name}. Reconnecting in 5s...`);
          setTimeout(() => joinVC247(newState.guild), 5); // ⚡ Instant Rejoin
        }
      } catch (e) { }
    }
    return;
  }

  // 1.5. VDEFEND: Protection against unauthorized moves
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    const fs = require("fs");
    const path = require("path");
    const VDEFEND_PATH = path.join(__dirname, "data/vdefend.json");
    if (fs.existsSync(VDEFEND_PATH)) {
      try {
        const vdb = JSON.parse(fs.readFileSync(VDEFEND_PATH, "utf8"));
        const defended = vdb[newState.guild.id] || [];
        if (defended.includes(newState.member.id)) {
          // Defended User Moved. Check Audit Logs to see if it was forced.
          // We wait a brief moment for audit log to populate
          setTimeout(async () => {
            const logs = await newState.guild.fetchAuditLogs({ type: 26, limit: 1 }).catch(() => null); // MEMBER_MOVE = 26
            if (logs) {
              const entry = logs.entries.first();
              if (entry && entry.target.id === newState.member.id &&
                entry.createdTimestamp > (Date.now() - 5000) &&
                entry.executor.id !== newState.member.id && // Not self-move
                entry.executor.id !== client.user.id // Not bot move
              ) {
                // IT WAS A FORCED MOVE!
                // Move them back
                await newState.setChannel(oldState.channelId, "🛡️ vdefend: Unauthorized Move Protection");

                // Punish/Warn Executor?
                // For now, just protect.
              }
            }
          }, 5);
        }
      } catch (e) { }
    }
  }

  // 2. Member VC Logs
  const { member } = newState;

  const embed = new EmbedBuilder().setTimestamp().setFooter({ text: "interX • Voice Log" });

  // Joined
  if (!oldState.channelId && newState.channelId) {
    embed.setColor("#bb0019")
      .setTitle("🔊 VC JOINED")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${member.user.tag}** joined voice channel **${newState.channel.name}**`);
  }
  // Left
  else if (oldState.channelId && !newState.channelId) {
    embed.setColor("#FF0000")
      .setTitle("🔇 VC LEFT")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${member.user.tag}** left voice channel **${oldState.channel.name}**`);
  }
  // Moved
  else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    embed.setColor("#dd0707")
      .setTitle("🔄 VC MOVED")
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`**${member.user.tag}** moved from **${oldState.channel.name}** to **${newState.channel.name}**`);
  } else {
    return; // Other updates (mute/unmute) we don't log for now to avoid spam
  }

  logToChannel(newState.guild, "voice", embed);

  // 1.7. TEMP VC SYSTEM: JOIN TO CREATE
  const TEMP_CONFIG_PATH = path.join(__dirname, "data/tempvc_config.json");
  if (newState.channelId && fs.existsSync(TEMP_CONFIG_PATH)) {
    try {
      const configArr = JSON.parse(fs.readFileSync(TEMP_CONFIG_PATH, "utf8"));
      const config = configArr[newState.guild.id];
      if (config && newState.channelId === config.generatorId) {
        const newChannel = await newState.guild.channels.create({
          name: `${newState.member.user.username}'s Temp VC`,
          type: 2, // Voice
          parent: newState.channel.parent,
          permissionOverwrites: [
            { id: newState.member.id, allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.Stream, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.DeafenMembers, PermissionsBitField.Flags.MoveMembers, PermissionsBitField.Flags.ManageChannels] },
            { id: newState.guild.roles.everyone, allow: [PermissionsBitField.Flags.Connect] }
          ]
        });

        const TEMP_VCS_PATH = path.join(__dirname, "data/temp_vcs.json");
        let tempVcs = {};
        if (fs.existsSync(TEMP_VCS_PATH)) { tempVcs = JSON.parse(fs.readFileSync(TEMP_VCS_PATH, "utf8")); }
        if (!tempVcs[newState.guild.id]) tempVcs[newState.guild.id] = [];
        tempVcs[newState.guild.id].push({ id: newChannel.id, ownerId: newState.member.id });
        fs.writeFileSync(TEMP_VCS_PATH, JSON.stringify(tempVcs, null, 2));

        await newState.setChannel(newChannel);

        const controlChannel = newState.guild.channels.cache.get(config.controlChannelId);
        if (controlChannel) {
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
          const vEmbed = new EmbedBuilder()
            .setColor("#da0000")
            .setTitle("🎙️ Temporary Voice Channel Created")
            .setDescription(`**Owner:** ${newState.member}\n**Channel:** ${newChannel}\n\nControls have been generated for your session.`)
            .setTimestamp();

          const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`vtc_lock_${newChannel.id}`).setLabel("Lock Channel").setStyle(ButtonStyle.Secondary).setEmoji("🔒"),
            new ButtonBuilder().setCustomId(`vtc_unlock_${newChannel.id}`).setLabel("Unlock Channel").setStyle(ButtonStyle.Secondary).setEmoji("🔓"),
            new ButtonBuilder().setCustomId(`vtc_hide_${newChannel.id}`).setLabel("Hide Channel").setStyle(ButtonStyle.Secondary).setEmoji("👻"),
            new ButtonBuilder().setCustomId(`vtc_show_${newChannel.id}`).setLabel("Show Channel").setStyle(ButtonStyle.Secondary).setEmoji("👁️")
          );

          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`vtc_mute_${newChannel.id}`).setLabel("Mute All").setStyle(ButtonStyle.Secondary).setEmoji("🔇"),
            new ButtonBuilder().setCustomId(`vtc_unmute_${newChannel.id}`).setLabel("Unmute All").setStyle(ButtonStyle.Secondary).setEmoji("🔊"),
            new ButtonBuilder().setCustomId(`vtc_rename_${newChannel.id}`).setLabel("Rename").setStyle(ButtonStyle.Primary).setEmoji("🖊️")
          );

          await controlChannel.send({ content: `${newState.member}`, embeds: [vEmbed], components: [row1, row2] });
        }
      }
    } catch (e) { console.error("Temp VC Create Error:", e); }
  }

  // 1.8. TEMP VC SYSTEM: AUTO-CLEANUP
  if (oldState.channelId && !newState.channelId) {
    const TEMP_VCS_PATH = path.join(__dirname, "data/temp_vcs.json");
    if (fs.existsSync(TEMP_VCS_PATH)) {
      try {
        let tempVcs = JSON.parse(fs.readFileSync(TEMP_VCS_PATH, "utf8"));
        const serverVcs = tempVcs[oldState.guild.id] || [];
        const vcEntry = serverVcs.find(v => v.id === oldState.channelId);

        if (vcEntry) {
          const channel = oldState.guild.channels.cache.get(oldState.channelId);
          if (channel && channel.members.size === 0) {
            await channel.delete("Temp VC empty").catch(() => { });
            tempVcs[oldState.guild.id] = serverVcs.filter(v => v.id !== oldState.channelId);
            fs.writeFileSync(TEMP_VCS_PATH, JSON.stringify(tempVcs, null, 2));
          }
        }
      } catch (e) { }
    }
  }
});

// 8. MODERATION LOGS (AUDIT LOGS)
// ─── ROGUE BOT TRACKER ───
// Per-guild per-bot dangerous action counter (resets every 30s)
const rogueBotMap = new Map();

async function enforceRogueBot(guild, botMember, reason) {
  if (!botMember) return;
  if (botMember.id === client.user.id) return;
  console.log(`🚨 [RogueBotSystem] BANNING rogue bot: ${botMember.user.tag} | Reason: ${reason}`);

  // 1. Ban the bot
  await guild.members.ban(botMember.id, { reason: `🛡️ Rogue Bot: ${reason}` }).catch(() => { });

  // 2. Fetch bot application owner via REST
  try {
    const app = await client.rest.get(`/applications/${botMember.id}/rpc`).catch(() => null);
    const ownerId = app?.owner?.id;
    if (ownerId) {
      const ownerMember = guild.members.cache.get(ownerId) || await guild.members.fetch(ownerId).catch(() => null);
      if (ownerMember) {
        console.log(`🚨 [RogueBotSystem] Kicking bot owner ${ownerMember.user.tag} from ${guild.name}`);
        await ownerMember.send(`⚠️ **SOVEREIGN SECURITY:** Your bot **${botMember.user.tag}** was detected performing hostile actions in **${guild.name}** and has been permanently banned. You are being removed from the server.`).catch(() => { });
        await ownerMember.kick(`Security: Your bot ${botMember.user.tag} performed unauthorized destructive actions.`).catch(() => { });
      }
    }
  } catch (e) { }

  // 3. Log
  const rogueEmbed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("🤖 ROGUE BOT NEUTRALIZED")
    .setDescription(`**Hostile bot detected and eliminated.**\n\n> **Bot:** ${botMember.user.tag} (\`${botMember.id}\`)\n> **Reason:** ${reason}\n> **Action:** Permanently Banned`)
    .setTimestamp()
    .setFooter({ text: "interX • Rogue Bot Intelligence" });
  logToChannel(guild, "security", rogueEmbed);
}

client.on("guildAuditLogEntryCreate", async (entry, guild) => {
  const { action, executorId, targetId, reason } = entry;
  const { AuditLogEvent } = require("discord.js");

  const executor = client.users.cache.get(executorId) || await client.users.fetch(executorId).catch(() => null);
  const target = client.users.cache.get(targetId) || await client.users.fetch(targetId).catch(() => null);

  // ─── 🤖 ROGUE BOT INTELLIGENCE SYSTEM ───
  // Triggers on ANY bot (even whitelisted) performing dangerous actions
  const DANGEROUS_ACTIONS = new Set([
    AuditLogEvent.ChannelDelete,
    AuditLogEvent.RoleDelete,
    AuditLogEvent.MemberBanAdd,
    AuditLogEvent.MemberKick,
    AuditLogEvent.WebhookCreate,
    AuditLogEvent.GuildUpdate,
    AuditLogEvent.EmojiDelete,
    AuditLogEvent.RoleCreate, // mass role creation = nuke prep
  ]);

  if (executor?.bot && executor.id !== client.user.id && DANGEROUS_ACTIONS.has(action)) {
    const key = `${guild.id}-${executor.id}`;
    const now = Date.now();
    const tracker = rogueBotMap.get(key) || { count: 0, firstSeen: now };

    // Reset if window expired (30s)
    if (now - tracker.firstSeen > 30000) {
      tracker.count = 0;
      tracker.firstSeen = now;
    }
    tracker.count++;
    rogueBotMap.set(key, tracker);

    // Threshold: 1 action for ultra-dangerous events, 2 for others
    const ultraDangerous = new Set([AuditLogEvent.ChannelDelete, AuditLogEvent.RoleDelete, AuditLogEvent.MemberBanAdd]);
    const threshold = ultraDangerous.has(action) ? 1 : 2;

    if (tracker.count >= threshold) {
      const botMember = guild.members.cache.get(executor.id) || await guild.members.fetch(executor.id).catch(() => null);
      const actionName = Object.keys(AuditLogEvent).find(k => AuditLogEvent[k] === action) || action;
      await enforceRogueBot(guild, botMember, `Autonomous dangerous action: ${actionName} (×${tracker.count})`);
      rogueBotMap.delete(key); // Reset after action
    }
  }

  // ─── STANDARD MODERATION LOGGING ───
  const embed = new EmbedBuilder()
    .setTimestamp()
    .setFooter({ text: "interX • Moderation Log" });

  let actionName = "";
  let color = "#ff1515";

  switch (action) {
    case AuditLogEvent.MemberBanAdd: actionName = "🔨 MEMBER BANNED"; color = "#FF0000"; break;
    case AuditLogEvent.MemberBanRemove: actionName = "🔓 MEMBER UNBANNED"; color = "#f10000"; break;
    case AuditLogEvent.MemberKick: actionName = "👞 MEMBER KICKED"; color = "#000000"; break;
    case AuditLogEvent.ChannelCreate: actionName = "📺 CHANNEL CREATED"; color = "#010305"; break;
    case AuditLogEvent.ChannelDelete: actionName = "📺 CHANNEL DELETED"; color = "#ff1c02"; break;
    case AuditLogEvent.RoleCreate: actionName = "🎭 ROLE CREATED"; color = "#e20000"; break;
    case AuditLogEvent.RoleDelete: actionName = "🎭 ROLE DELETED"; color = "#ED4245"; break;
    case AuditLogEvent.EmojiCreate: actionName = "😀 EMOJI CREATED"; color = "#ff0000"; break;
    case AuditLogEvent.EmojiDelete: actionName = "🗑️ EMOJI DELETED"; color = "#E74C3C"; break;
    case AuditLogEvent.MemberUpdate:
      const timeoutChange = entry.changes?.find(c => c.key === "communication_disabled_until");
      if (timeoutChange) {
        actionName = timeoutChange.new ? "🔇 MEMBER TIMED OUT" : "🔊 TIMEOUT REMOVED";
        color = timeoutChange.new ? "#fc1900" : "#f50000";
      }
      break;
  }

  if (!actionName) return;

  embed.setColor(color)
    .setTitle(actionName)
    .addFields(
      { name: "👤 Target", value: target ? `${target.tag} (\`${target.id}\`)` : "Unknown", inline: true },
      { name: "⚖️ Moderator", value: executor ? `${executor.tag} (\`${executor.id}\`)` : "Unknown", inline: true },
      { name: "📜 Reason", value: reason || "No reason provided", inline: false }
    );

  logToChannel(guild, "mod", embed);
});

// ───── INTERACTION HANDLER (CONSOLIDATED) ─────
client.on("interactionCreate", async interaction => {
  const { customId, guild, user, values } = interaction;

  // ───── TEMP VC MODAL HANDLER ─────
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("vtc_modal_rename_")) {
      const vcId = interaction.customId.split("_")[3];
      const newName = interaction.fields.getTextInputValue("new_name");

      const vc = guild.channels.cache.get(vcId);
      if (!vc) return interaction.reply({ content: "❌ Voice channel not found.", ephemeral: true });

      try {
        await vc.setName(newName);
        await interaction.reply({ content: `✅ Voice channel renamed to **${newName}**.`, ephemeral: true });
      } catch (e) {
        console.error("VTC Rename Error:", e);
        await interaction.reply({ content: "❌ Failed to rename channel. Check bot permissions or rate limits.", ephemeral: true });
      }
    }
    return;
  }

  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // ───── TICKET SYSTEM HANDLERS ─────
  if (customId === "create_ticket" || customId === "open_ticket" || customId === "ticket_category") {
    await interaction.deferReply({ ephemeral: true });
    let category = "Support";
    if (customId === "ticket_category" && values && values.length > 0) {
      const val = values[0];
      if (val === "ticket_report") { category = "Report"; }
      if (val === "ticket_apply") { category = "Application"; }
    }
    const channelName = `ticket-${category.toLowerCase()}-${user.username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`.substring(0, 32);
    const existingChannel = guild.channels.cache.find(c => c.name.includes(`ticket`) && c.name.includes(user.username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()));
    if (existingChannel) return interaction.editReply(`⚠️ **You already have an open ticket:** ${existingChannel}`);

    try {
      const channel = await guild.channels.create({
        name: channelName,
        type: 0,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
          { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AttachFiles] }
        ]
      });

      const ticketLogEmbed = new EmbedBuilder()
        .setColor("#fc0000")
        .setTitle("🎫 TICKET CREATED")
        .addFields({ name: "👤 User", value: `${user} (\`${user.id}\`)`, inline: true }, { name: "📂 Channel", value: `${channel}`, inline: true });
      logToChannel(guild, "ticket", ticketLogEmbed);

      const botAvatar = V2.botAvatar({ guild, client });

      const ticketId = channel.name.split("-").pop() || "SYSTEM";
      const mainSection = V2.section([
        V2.heading(`Support Ticket — #${ticketId.toUpperCase()}`, 1),
        V2.text(`\nWelcome, ${user}!\nSupport will be with you shortly.\nTo close this ticket, click the button below.`)
      ], botAvatar);

      const closeButton = new ButtonBuilder().setCustomId("close_ticket").setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Danger);
      const claimButton = new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim").setEmoji("✅").setStyle(ButtonStyle.Success);
      const row = new ActionRowBuilder().addComponents(closeButton, claimButton);

      const container = V2.container([
        mainSection,
        V2.separator(),
        V2.field("📂 Category", category, true),
        V2.field("👤 Creator", user.tag, true),
        V2.separator(),
        row
      ], V2_RED);

      await channel.send({
        content: `${user} | <@${BOT_OWNER_ID}> | <@${BOT_DEV_ID}>`
      });

      await channel.send({
        components: [container]
      });
      await interaction.editReply(`✅ **Secure Channel Created:** ${channel}`);
    } catch (err) {
      console.error("🎫 Ticket Creation Error:", err);
      await interaction.editReply(`❌ Failed to establish secure connection. Error: ${err.message || "Unknown"}`);
    }
  }

  if (customId === "close_ticket") {
    const botAvatar = V2.botAvatar({ guild, client });
    const closeSection = V2.section([
      V2.heading("🔒 SECURE CHANNEL CLOSING", 3),
      V2.text("The session has been terminated. This channel will be purged immediately.")
    ], botAvatar);

    await interaction.reply({
      components: [V2.container([closeSection], V2_RED)]
    });

    // Log deletion
    const closeEmbed = new EmbedBuilder()
      .setColor("#FF3131")
      .setTitle("🔒 TICKET CLOSED")
      .setDescription(`**Channel:** \`${interaction.channel.name}\`\n**Closed By:** ${user} (\`${user.id}\`)`)
      .setTimestamp();
    logToChannel(guild, "ticket", closeEmbed);

    setTimeout(() => { interaction.channel.delete().catch(() => { }); }, 2000);
  }

  if (customId === "claim_ticket") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: "🚫 **Access Denied:** Only staff can claim tickets.", ephemeral: true });
    }

    const botAvatar = V2.botAvatar({ guild, client });
    await interaction.channel.permissionOverwrites.edit(user.id, {
      SendMessages: true,
      ViewChannel: true,
      ManageChannels: true
    });

    const claimEmbed = V2.container([
      V2.section([
        V2.heading("✅ TICKET CLAIMED", 3),
        V2.text(`**Official Response Initiated.**\n\n> **Handler:** ${user}\n> **Status:** ACTIVE CONVERSATION`)
      ], botAvatar)
    ], "#00FF00");

    await interaction.update({
      components: [interaction.message.components[0]] // Keep buttons but updated logic
    }).catch(() => { });

    await interaction.followUp({
      components: [claimEmbed]
    });
  }

  // ───── TEMP VC BUTTON HANDLER ─────
  if (customId.startsWith("vtc_")) {
    const parts = customId.split("_");
    const action = parts[1];
    const vcId = parts[2];

    const TEMP_VCS_PATH = path.join(__dirname, "data/temp_vcs.json");
    if (fs.existsSync(TEMP_VCS_PATH)) {
      let tempVcs = JSON.parse(fs.readFileSync(TEMP_VCS_PATH, "utf8"));
      const vcEntry = (tempVcs[guild.id] || []).find(v => v.id === vcId);
      if (!vcEntry) return interaction.reply({ content: "❌ This channel is no longer active.", ephemeral: true });
      if (vcEntry.ownerId !== user.id && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "🚫 **Access Denied:** Only the owner can use these controls.", ephemeral: true });
      }

      const vc = guild.channels.cache.get(vcId);
      if (!vc) return interaction.reply({ content: "❌ Voice channel not found.", ephemeral: true });

      try {
        switch (action) {
          case "lock": await vc.permissionOverwrites.edit(guild.roles.everyone, { Connect: false }); await interaction.reply({ content: "🔒 Voice channel **locked**.", ephemeral: true }); break;
          case "unlock": await vc.permissionOverwrites.edit(guild.roles.everyone, { Connect: true }); await interaction.reply({ content: "🔓 Voice channel **unlocked**.", ephemeral: true }); break;
          case "hide": await vc.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false }); await interaction.reply({ content: "👻 Voice channel **hidden**.", ephemeral: true }); break;
          case "show": await vc.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: true }); await interaction.reply({ content: "👁️ Voice channel **visible**.", ephemeral: true }); break;
          case "mute": vc.members.forEach(async m => { if (m.id !== user.id) await m.voice.setMute(true).catch(() => { }); }); await interaction.reply({ content: "🔇 Members **muted**.", ephemeral: true }); break;
          case "unmute": vc.members.forEach(async m => { if (m.id !== user.id) await m.voice.setMute(false).catch(() => { }); }); await interaction.reply({ content: "🔊 Members **unmuted**.", ephemeral: true }); break;
          case "rename":
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ModalActionRow } = require("discord.js");
            const modal = new ModalBuilder().setCustomId(`vtc_modal_rename_${vcId}`).setTitle("Rename Voice Channel");
            const input = new TextInputBuilder().setCustomId("new_name").setLabel("Enter New Name").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32);
            modal.addComponents(new ModalActionRow().addComponents(input));
            await interaction.showModal(modal);
            break;
        }
      } catch (e) { await interaction.reply({ content: "❌ Action failed.", ephemeral: true }).catch(() => { }); }
    }
  }

  // ───── VERIFICATION SYSTEM ─────
  if (customId.startsWith("verify_")) {
    const roleId = customId.split("_")[1];
    const role = guild.roles.cache.get(roleId);
    if (!role) return interaction.reply({ content: "❌ Role not found.", ephemeral: true });
    if (interaction.member.roles.cache.has(roleId)) return interaction.reply({ content: "✅ Already verified.", ephemeral: true });

    try {
      await interaction.member.roles.add(role);

      const vEmbed = new EmbedBuilder()
        .setColor("#e40000")
        .setTitle("✅ MEMBER VERIFIED")
        .setDescription(`**User:** ${user.tag}\n**Role:** ${role.name}`)
        .setTimestamp();
      logToChannel(guild, "verify", vEmbed);

      const { V2_BLUE } = require("./config");
      const successPanel = V2.container([
        V2.section([
          V2.heading("✨ IDENTITY VERIFIED", 2),
          V2.text(`Welcome to the sanctuary, ${user.username}.`)
        ], V2.botAvatar(interaction)),
        V2.separator(),
        V2.text(`The registry role **${role.name}** has been permanently bound to your profile. All sectors are now accessible.`)
      ], V2_BLUE);

      return interaction.reply({
        flags: V2.flag,
        components: [successPanel],
        ephemeral: true
      });
    } catch (e) {
      return interaction.reply({
        flags: V2.flag,
        components: [V2.container([V2.text("❌ **Registry Error:** Failed to apply roles. Consult the High Comand.")], "#FF0000")],
        ephemeral: true
      });
    }
  }
});


// ───── REACTION ROLES ─────
const RR_DB_PATH = path.join(__dirname, "data/reactionroles.json");

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  // Fetch partial reactions
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error("Failed to fetch reaction:", err);
      return;
    }
  }

  // Check if this is a reaction role message
  if (!fs.existsSync(RR_DB_PATH)) return;

  let rrData = {};
  try {
    rrData = JSON.parse(fs.readFileSync(RR_DB_PATH, "utf8"));
  } catch (e) {
    return;
  }

  const panel = rrData[reaction.message.id];
  if (!panel) return;

  // Find the role for this emoji
  const roleConfig = panel.roles.find(r => r.emoji === reaction.emoji.toString() || r.emoji === reaction.emoji.name);
  if (!roleConfig) return;

  // Add role to user
  try {
    const member = reaction.message.guild.members.cache.get(user.id) || await reaction.message.guild.members.fetch(user.id).catch(() => null);
    const role = reaction.message.guild.roles.cache.get(roleConfig.roleId);

    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      console.log(`✅ Added role ${role.name} to ${user.tag}`);
    }
  } catch (err) {
    console.error("Failed to add role:", err);
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  // Fetch partial reactions
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (err) {
      console.error("Failed to fetch reaction:", err);
      return;
    }
  }

  // Check if this is a reaction role message
  if (!fs.existsSync(RR_DB_PATH)) return;

  let rrData = {};
  try {
    rrData = JSON.parse(fs.readFileSync(RR_DB_PATH, "utf8"));
  } catch (e) {
    return;
  }

  const panel = rrData[reaction.message.id];
  if (!panel) return;

  // Find the role for this emoji
  const roleConfig = panel.roles.find(r => r.emoji === reaction.emoji.toString() || r.emoji === reaction.emoji.name);
  if (!roleConfig) return;

  // Remove role from user
  try {
    const member = reaction.message.guild.members.cache.get(user.id) || await reaction.message.guild.members.fetch(user.id).catch(() => null);
    const role = reaction.message.guild.roles.cache.get(roleConfig.roleId);

    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      console.log(`❌ Removed role ${role.name} from ${user.tag}`);
    }
  } catch (err) {
    console.error("Failed to remove role:", err);
  }
});

// ───── INTERACTION HANDLER (Verify & Apps) ─────
// Redundant interactionCreate listener merged above

// ───── ANTI-NUKE SYSTEM (Moved to Top) ─────
// Definitions moved to top of file for scope availability
// const ANTINUKE_DB = path.join(__dirname, "data/antinuke.json");
// const nukeMap = new Map();
// checkNuke and punishNuker functions are now at the top.

// checkNuke moved to top

// punishNuker moved to top

// Redundant channelDelete listener merged above

// Redundant roleDelete listener merged at Line 1696

// ───── AUTOBAN PROTOCOL (PERSISTENCE) ─────
client.on("guildBanRemove", async (ban) => {
  const fs = require("fs");
  const path = require("path");
  const BL_PATH = path.join(__dirname, "data/blacklist.json");

  if (fs.existsSync(BL_PATH)) {
    try {
      const blacklist = JSON.parse(fs.readFileSync(BL_PATH, "utf8"));
      if (blacklist.includes(ban.user.id)) {
        // User is blacklisted but was unbanned. FORCE RE-BAN.
        await ban.guild.members.ban(ban.user.id, { reason: "🛡️ AUTOBAN: User is globally blacklisted." })
          .then(() => console.log(`[AUTOBAN] Re-banned ${ban.user.tag} in ${ban.guild.name}`))
          .catch(e => console.error(`[AUTOBAN] Failed to re-ban ${ban.user.tag}:`, e));
      }
    } catch (e) { }
  }
});

// ───── GHOST PROTOCOL: WEBHOOK SHIELD ─────
client.on("webhooksUpdate", async (channel) => {
  const logs = await channel.guild.fetchAuditLogs({ type: 76, limit: 1 }).catch(() => null); // 76 = WEBHOOK_CREATE
  const entry = logs?.entries.first();
  if (!entry || Date.now() - entry.createdTimestamp > 5000) return;

  const executor = entry.executor;
  if (!executor || executor.id === client.user.id) return;

  // Anti-Nuke Bypass Check
  const ANTINUKE_DB = path.join(__dirname, "data/antinuke.json");
  let db = {};
  if (fs.existsSync(ANTINUKE_DB)) {
    try { db = JSON.parse(fs.readFileSync(ANTINUKE_DB, "utf8")); } catch (e) { }
  }
  const config = db[channel.guild.id] || {};
  const isWhitelisted = (config.whitelisted || []).includes(executor.id) || isBypass(executor.id) || channel.guild.ownerId === executor.id;

  if (!isWhitelisted) {
    try {
      // 1. Terminate all unauthorized webhooks in this channel
      const webhooks = await channel.fetchWebhooks();
      const targets = webhooks.filter(wh => wh.owner.id === executor.id);
      for (const [id, wh] of targets) {
        await wh.delete("🛡️ Ghost Protocol: Unauthorized Webhook Terminated").catch(() => { });
      }

      // 2. Punish Intruder
      punishNuker(channel.guild, executor, "Unauthorized Webhook Creation");

      // 3. V2 Notification
      const V2 = require("./utils/v2Utils");
      const { V2_RED } = require("./config");
      const interceptContainer = V2.container([
        V2.section([
          V2.heading("👻 GHOST PROTOCOL ACTIVATED", 2),
          V2.text(`**Intrusion Detected:** Unauthorized Webhook Linkage.\n\n**STATUS:** System intercepted and dissolved the rogue endpoint.\n**RESPONSE:** Intruder ejected. Accountability enforced.`)
        ], "https://cdn-icons-png.flaticon.com/512/9167/9167385.png"),
        V2.separator(),
        V2.text(`**Target:** @${executor.username} • **Sector:** ${channel.name}`),
        V2.text(`*Protocol: ZERO_TRUST_WEBHOOK*`)
      ], V2_RED);

      logToChannel(channel.guild, "security", interceptContainer);

    } catch (e) { console.error("Ghost Protocol Error:", e); }
  }
});


// ───── SOVEREIGN STRIP: DANGEROUS ROLE PROTECTION ─────
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  // Check for Role Additions
  const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  if (addedRoles.size === 0) return;

  const dangerousPerms = [
    PermissionsBitField.Flags.Administrator,
    PermissionsBitField.Flags.ManageRoles,
    PermissionsBitField.Flags.ManageChannels,
    PermissionsBitField.Flags.ManageGuild,
    PermissionsBitField.Flags.ManageWebhooks,
    PermissionsBitField.Flags.MentionEveryone,
    PermissionsBitField.Flags.BanMembers,
    PermissionsBitField.Flags.KickMembers
  ];

  const hasDangerousGrant = addedRoles.some(role =>
    dangerousPerms.some(perm => role.permissions.has(perm))
  ) || addedRoles.some(r => r.name.toLowerCase().includes("admin"));

  if (!hasDangerousGrant) return;

  // Audit Interrogation
  const logs = await newMember.guild.fetchAuditLogs({ type: 25, limit: 1 }).catch(() => null); // 25 = MEMBER_ROLE_UPDATE
  if (!logs) return;

  const entry = logs.entries.first();
  if (!entry || Date.now() - entry.createdTimestamp > 5000 || entry.target.id !== newMember.id) return;

  const executor = entry.executor;
  if (!executor || executor.id === client.user.id) return;

  // Whitelist Check
  const owners = getOwnerIds(newMember.guild.id);
  const WHITELIST_PATH = path.join(__dirname, "data/whitelist.json");
  let whitelist = {};
  if (fs.existsSync(WHITELIST_PATH)) {
    try { whitelist = JSON.parse(fs.readFileSync(WHITELIST_PATH, "utf8")); } catch (e) { }
  }

  const guildWhitelist = whitelist[newMember.guild.id] || [];
  const isAuthorized = owners.includes(executor.id) || guildWhitelist.includes(executor.id);

  // 1. TRUST CHAIN LOGGING (If Granter is Extra Owner)
  if (isAuthorized && !isBypass(executor.id) && executor.id !== newMember.guild.ownerId) {
    logTrustGrant(newMember.guild.id, executor.id, newMember.id);
    return;
  }

  if (!isAuthorized) {
    try {
      // 1. Log the Breach (V2)
      const V2 = require("./utils/v2Utils");
      const { V2_RED } = require("./config");
      const breachContainer = V2.container([
        V2.heading("🛡️ SOVEREIGN STRIP ACTIVATED", 2),
        V2.text(`**High-Risk Elevation Detected.** Unauthorized Admin grant intercepted.\n\n**Executor:** @${executor.username}\n**Target:** @${newMember.user.username}\n**Roles:** ${addedRoles.map(r => r.name).join(", ")}`),
        V2.separator(),
        V2.text(`*Protocol: ZERO_TRUST_ELEVATION • Response: INSTANT_NULLIFICATION*`)
      ], V2_RED);
      logToChannel(newMember.guild, "security", breachContainer);

      // 2. NULL OUT the offending role's permissions completely
      for (const [id, role] of addedRoles) {
        if (role.permissions.has(PermissionsBitField.Flags.Administrator) || role.name.toLowerCase().includes("admin")) {
          await role.setPermissions(0n, "Sovereign Strip: Nullifying unauthorized Admin role.").catch(() => { });
        }
      }

      // 3. Strip ALL roles from the target (receiver)
      if (newMember.manageable) {
        await newMember.roles.set([], "Sovereign Strip: Unauthorized high-risk role received.").catch(() => { });
      }

      // 4. Kick the target
      if (newMember.kickable) {
        await newMember.send("⚠️ **SECURITY VIOLATION:** You received an unauthorized Admin-level role in **" + newMember.guild.name + "**. All roles stripped. Ejection enforced.").catch(() => { });
        await newMember.kick("🛡️ Sovereign Strip: Unauthorized Admin elevation — target ejected.").catch(() => { });
      }

      // 5. Punish the Executor: Strip their roles too
      const executorMember = newMember.guild.members.cache.get(executor.id) || await newMember.guild.members.fetch(executor.id).catch(() => null);
      if (executorMember && executorMember.manageable) {
        await executorMember.roles.set([], "Sovereign Strip: Unauthorized high-risk role grant.").catch(() => { });
        await executor.send("⚠️ **SECURITY VIOLATION:** You attempted to grant Admin-level permissions in **" + newMember.guild.name + "** without authorization. All your roles have been stripped.").catch(() => { });
      }

    } catch (err) {
      console.error("Sovereign Strip Error:", err);
    }
  }
});

// Redundant guildBanAdd listener merged at Line 1674

// Redundant listener removed



// ───── LOGGING EVENT HANDLER ─────
// ───── LOGGING EVENT HANDLER (MIGRATED TO CV2) ─────
async function logToChannel(guild, type, payload) {
  if (!guild) return;

  const V2 = require("./utils/v2Utils");
  const V2_FLAG = V2.flag; // 32768

  // Accent colors per log type
  const TYPE_COLORS = {
    security: "#000000",
    antinuke: "#000000",
    mod: "#000000",
    member: "#000000",
    message: "#000000",
    file: "#000000",
    action: "#000000",
    admin: "#000000",
    role: "#000000",
    channel: "#000000",
    voice: "#000000",
    server: "#000000",
    invite: "#2b2626",
    ticket: "#000000",
    verify: "#000000",
  };
  const accentHex = TYPE_COLORS[type] || "#5865F2";

  // Bot server-specific PFP
  const botMember = guild.members.cache.get(client.user.id);
  const botPFP = botMember
    ? botMember.displayAvatarURL({ forceStatic: false, size: 512 })
    : client.user.displayAvatarURL({ forceStatic: false, size: 512 });

  // Convert EmbedBuilder data to V2 ContainerBuilder
  function embedToV2(embedInput, forGlobal) {
    const d = embedInput.data || embedInput;
    const comps = [];

    const titleText = d.title || "\uD83D\uDCCB LOG ENTRY";
    const timestamp = Math.floor(Date.now() / 1000);
    const serverLine = forGlobal
      ? "> \uD83C\uDF10 **GLOBAL LOG** \u2022 **Server:** " + guild.name + " \u2022 **ID:** `" + guild.id + "` \u2022 <t:" + timestamp + ":f>"
      : "> **Sector:** `" + type.toUpperCase() + "` \u2022 **Server:** " + guild.name + " \u2022 <t:" + timestamp + ":T>";

    comps.push(V2.section([V2.heading(titleText, 2), V2.text(serverLine)], botPFP));
    comps.push(V2.separator());

    const desc = (d.description || "").replace(/\u200b/g, "").trim();
    if (desc) {
      comps.push(V2.text(desc));
      comps.push(V2.separator());
    }

    if (d.fields && d.fields.length > 0) {
      const realFields = d.fields.filter(f =>
        f.name && f.value &&
        f.name.trim() !== "" &&
        f.value.trim() !== "" &&
        f.name !== "\u200b" &&
        f.value !== "\u200B"
      );
      for (let i = 0; i < realFields.length; i += 2) {
        const chunk = realFields.slice(i, i + 2);
        comps.push(V2.section(chunk.map(f => V2.text("**" + f.name + "**\n" + f.value))));
      }
      if (realFields.length > 0) comps.push(V2.separator());
    }

    const footerText = d.footer?.text || ("interX \u2022 " + type.toUpperCase() + " Log");
    const footerDisplay = forGlobal
      ? "*Universal Intelligence \u2022 Sector: " + type.toUpperCase() + " \u2022 " + guild.name + "*"
      : "*" + footerText + "*";
    comps.push(V2.text(footerDisplay));

    return V2.container(comps, accentHex);
  }

  // Wrap existing V2 container with a bot-PFP header
  function wrapV2(existingContainer, forGlobal) {
    const timestamp = Math.floor(Date.now() / 1000);
    const serverLine = forGlobal
      ? "> \uD83C\uDF10 **GLOBAL LOG** \u2022 **Server:** " + guild.name + " \u2022 **ID:** `" + guild.id + "` \u2022 <t:" + timestamp + ":f>"
      : "> **Sector:** `" + type.toUpperCase() + "` \u2022 **Server:** " + guild.name + " \u2022 <t:" + timestamp + ":T>";
    const headerCtr = V2.container([
      V2.section([V2.text(serverLine)], botPFP),
      V2.separator(),
    ], accentHex);
    return [headerCtr, existingContainer];
  }

  const isV2Input = payload && (payload.constructor?.name === "ContainerBuilder" || (payload.addSectionComponents && payload.toJSON));

  // 1. UNIVERSAL LOGGING (ELOGS)
  const ELOGS_DB = path.join(__dirname, "data/elogs.json");
  if (fs.existsSync(ELOGS_DB)) {
    try {
      const eData = JSON.parse(fs.readFileSync(ELOGS_DB, "utf8"));
      const eChannelId = eData[type] || eData["server"];
      if (eChannelId) {
        const eChannel = await client.channels.fetch(eChannelId).catch(() => null);
        if (eChannel) {
          if (isV2Input) {
            await eChannel.send({ content: null, flags: V2_FLAG, components: wrapV2(payload, true) }).catch(() => { });
          } else {
            await eChannel.send({ content: null, flags: V2_FLAG, components: [embedToV2(payload, true)] }).catch(() => { });
          }
        }
      }
    } catch (e) { console.error("[LOG] Global Error:", e); }
  }

  // 1. LOCAL LOGGING
  const LOGS_DB = path.join(__dirname, "data/logs.json");
  if (!fs.existsSync(LOGS_DB)) return;

  try {
    const data = JSON.parse(fs.readFileSync(LOGS_DB, "utf8"));
    const guildData = data[guild.id];
    if (!guildData) return;

    const channelId = guildData[type] || guildData["security"] || guildData["server"];
    if (!channelId) return;

    const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    if (isV2Input) {
      await channel.send({ content: null, flags: V2_FLAG, components: wrapV2(payload, false) }).catch(() => { });
    } else {
      await channel.send({ content: null, flags: V2_FLAG, components: [embedToV2(payload, false)] }).catch(() => { });
    }
  } catch (e) { console.error("[LOG] Local Error:", e); }
}

// ───── SERVER STATS UPDATER ─────
setInterval(async () => {

  const STATS_DB = path.join(__dirname, "data/serverstats.json");
  if (!fs.existsSync(STATS_DB)) return;

  let data = {};
  try { data = JSON.parse(fs.readFileSync(STATS_DB, "utf8")); } catch (e) { return; }

  for (const [guildId, config] of Object.entries(data)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    try {
      // Total
      if (config.totalId) {
        const ch = guild.channels.cache.get(config.totalId);
        if (ch) await ch.setName(`Total Members: ${guild.memberCount}`).catch(() => { });
      }
      // Bots
      if (config.botsId) {
        const ch = guild.channels.cache.get(config.botsId);
        // Need to ensure members are cached or fetch count? 
        // guild.memberCount is accurate. Bot count might require fetch if not cached?
        // For now rely on cache or just Total.
        // Let's rely on cache for bots (usually fine for small/medium bots, larger bots use sharding/intents)
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        if (ch) await ch.setName(`Bots: ${botCount}`).catch(() => { });
      }
    } catch (e) {
      console.error(`Failed to update stats for ${guild.name}:`, e);
    }
  }
}, 600000); // 10 Minutes

// End of file


// ───── LOGIN ─────
client.login(process.env.TOKEN);






// ───── EXPRESS WEB SERVER ─────
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive");
});

const PORT = process.env.PORT || 3000;

webServer = app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ───── EXPORTS (For commands) ─────
module.exports = {
  getOwnerIds,
  refreshOwnerCache,
  db
};
