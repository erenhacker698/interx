const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "temproles.json");

// Define duration multipliers explicitly
const TIME_MULTIPLIERS = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
};

// ───── HELPERS ─────
function loadTempRoles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return [];
    }
}

function saveTempRoles(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function parseDuration(str) {
    const match = str.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    return value * TIME_MULTIPLIERS[unit];
}

module.exports = {
    name: "temprole",
    description: "Give a user a temporary role",
    usage: "!temprole @User @Role <duration> (e.g. 1h, 30m)",
    permissions: [PermissionsBitField.Flags.ManageRoles],

    // ───── BACKGROUND MONITORING ─────
    init(client) {
        console.log("⏱️ TempRole monitoring started...");

        // Check every minute
        setInterval(async () => {
            const activeRoles = loadTempRoles();
            const now = Date.now();
            let changed = false;
            const remainingRoles = [];

            for (const entry of activeRoles) {
                if (now >= entry.expiresAt) {
                    // Expired - Remove Role
                    try {
                        const guild = client.guilds.cache.get(entry.guildId);
                        if (!guild) continue; // Guild unavailable? skip removal but don't keep in DB? actually drop it.

                        const member = await guild.members.fetch(entry.userId).catch(() => null);
                        const role = guild.roles.cache.get(entry.roleId);

                        if (member && role) {
                            await member.roles.remove(role);
                            console.log(`[TempRole] Removed expired role ${role.name} from ${member.user.tag}`);
                        }
                        changed = true;
                    } catch (err) {
                        console.error(`[TempRole] Failed to remove role for ${entry.userId}:`, err);
                        // If we failed (e.g. missing perms), should we keep trying? 
                        // For simplicity, we drop it to avoid infinite retries if persistent error.
                        changed = true;
                    }
                } else {
                    remainingRoles.push(entry);
                }
            }

            if (changed) {
                saveTempRoles(remainingRoles);
            }
        }, 60 * 1000); // 1 minute interval
    },

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        // Permission check (Bypass for owner)
        if (!isBotOwner && !isServerOwner && !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 I do not have permission to manage roles.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        // ───── ARGS VALIDATION ─────
        // Usage: !temprole @User <RoleName|RoleID|@Role> <duration>

        const member = message.mentions.members.first();

        // Find Duration first (regex)
        const durationArg = args.find(a => /^\d+[smhd]$/.test(a));

        // Find Role: 
        // 1. Mention?
        // 2. ID?
        // 3. Name search?
        // We must exclude the User arg and the Duration arg to find the Role arg string.
        let role = message.mentions.roles.first();

        if (!role) {
            // Filter out the duration arg and the user mention from args to get the role string
            const otherArgs = args.filter(a => a !== durationArg && !a.startsWith("<@") && !a.match(/^\d{17,19}$/)); // Basic filter

            // Actually, a better way is:
            // The user arg is usually args[0], duration can be anywhere.
            // Let's try to find a role matching any remaining arg if we didn't find a mention.

            // If we have a duration arg, remove it from consideration
            const filteredArgs = args.filter(a => a !== durationArg);

            // Assume member is one of them.
            // But we already have 'member' object.

            // Let's try to find the role by ID or Name from the arguments that are NOT the duration.
            // We join remaining args to search by name if needed, but 'temprole' syntax is specific.
            // Usage: !temprole @User <role> <duration>

            // Attempt 1: Check if there's a Role ID in args
            const potentialId = args.find(a => /^\d{17,19}$/.test(a) && a !== member?.id);
            if (potentialId) {
                role = message.guild.roles.cache.get(potentialId);
            }

            // Attempt 2: Search by name (fuzzy)
            if (!role) {
                const query = args.filter(a => a !== durationArg && !a.includes(member?.id) && !a.startsWith("<@")).join(" ");
                if (query) {
                    role = message.guild.roles.cache.find(r => r.name.toLowerCase() === query.toLowerCase()) ||
                        message.guild.roles.cache.find(r => r.name.toLowerCase().includes(query.toLowerCase()));
                }
            }
        }

        if (!member) {
            return message.reply({
                content: null,
                components: [V2.container(["⚠️ **Missing User.** Please mention a user."], require("../config").WARN_COLOR)]
            });
        }

        if (!durationArg) {
            return message.reply({
                content: null,
                components: [V2.container(["⚠️ **Missing Duration.** Example: `1h`, `30m`."], require("../config").WARN_COLOR)]
            });
        }

        if (!role) {
            return message.reply({
                content: null,
                components: [V2.container(["⚠️ **Missing Role.** Please mention a role or provide a valid name/ID."], require("../config").WARN_COLOR)]
            });
        }

        // ───── HIERARCHY CHECK ─────
        // Owner bypasses everything. Everyone else gets checked.
        if (!isBotOwner && !isServerOwner && role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({
                content: null,
                components: [V2.container(["🚫 Role hierarchy prevents this action."], require("../config").ERROR_COLOR)]
            });
        }

        const durationMs = parseDuration(durationArg);
        if (!durationMs) return message.reply("❌ Invalid duration format.");

        const expiresAt = Date.now() + durationMs;

        try {
            await member.roles.add(role);

            // Save to DB
            const db = loadTempRoles();
            db.push({
                guildId: message.guild.id,
                userId: member.id,
                roleId: role.id,
                expiresAt: expiresAt,
                addedAt: Date.now()
            });
            saveTempRoles(db);

            const container = V2.container([
                V2.section([
                    `**Temporary Assignment**`,
                    `Provisional access granted.`
                ], message.guild.iconURL({ dynamic: true, size: 512 })),
                `\u200b`,
                `Operative **${member.user.username}** has been granted temporary clearance.`,
                `\u200b`,
                `**Role:** ${role.name}`,
                `**Duration:** ${durationArg}`,
                `**Expiration:** <t:${Math.floor(expiresAt / 1000)}:R>`,
                `\u200b`,
                `Architect: <@${BOT_OWNER_ID}>` ], "#0099ff"); // Blue for creation/success

            return message.channel.send({ content: null, components: [container] });

        } catch (err) {
            console.error(err);
            return message.reply("❌ Failed to assign role.");
        }
    }
};
