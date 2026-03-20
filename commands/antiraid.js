const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID, SUCCESS_COLOR, ERROR_COLOR, WARN_COLOR } = require("../config");
const { isBypass } = require("../utils/bypass_system.js");
const fastCache = require("../utils/fastCache");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "antiraid.json");

// ───── DATA MANAGEMENT ─────
// Migrated to fastCache for performance.

module.exports = {
    name: "antiraid",
    description: "Configure anti-raid protection system",
    usage: "!antiraid <on|off|config|status|unlock>",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const isBotOwner = isBypass(message.author.id);
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Only the **Bot Owner** or **Server Owner** can manage Anti-Raid protocols."])] });
        }

        const subCommand = args[0]?.toLowerCase();
        const config = fastCache.get(DB_PATH) || {};
        const guildConfig = config[message.guild.id] || { 
            enabled: false, 
            threshold: 5, 
            timeWindow: 10,
            action: "lock", // lock, kick, ban
            minAge: 1, // days
            avatarRequired: false
        };

        // ───── STATUS ─────
        if (!subCommand || subCommand === "status") {
            const statusContainer = V2.container([
                V2.section([
                    "🛡️ [ PROTOCOL: ANTI_RAID_DIAGNOSTICS ]",
                    `**Real-time State:** ${guildConfig.enabled ? "✅ ACTIVE" : "❌ DEACTIVATED"}`
                ], "https://cdn-icons-png.flaticon.com/512/3524/3524812.png"),
                V2.separator(),
                V2.heading("System Configuration", 3),
                `> **Threshold:** \`${guildConfig.threshold}\` joins / \`${guildConfig.timeWindow}s\`\n` +
                `> **Current Mode:** \`${guildConfig.action.toUpperCase()}\`\n` +
                `> **Min Account Age:** \`${guildConfig.minAge} Days\`\n` +
                `> **Avatar Required:** \`${guildConfig.avatarRequired ? "YES" : "NO"}\``,
                V2.separator(),
                V2.heading("Operational Logic", 3),
                `If detection triggers, the system will execute **${guildConfig.action.toUpperCase()}** on all raiders and ${guildConfig.action === "lock" ? "lockdown all channels" : "purge malicious accounts"}.`,
                "*interX Sovereign Security Matrix*"
            ]);

            return message.reply({ content: null, components: [statusContainer] });
        }

        // ───── ON/OFF ─────
        if (subCommand === "on" || subCommand === "off") {
            guildConfig.enabled = subCommand === "on";
            config[message.guild.id] = guildConfig;
            fastCache.set(DB_PATH, config);

            return message.reply({
                components: [V2.container([
                    V2.section([
                        `🛡️ ANTI-RAID: ${guildConfig.enabled ? "ACTIVE" : "DISABLED"}`,
                        `Protocol ${guildConfig.enabled ? "Engaged" : "Disengaged"}. Server security updated.`
                    ])
                ])]
            });
        }

        // ───── CONFIG ─────
        if (subCommand === "config" || subCommand === "set") {
            const type = args[1]?.toLowerCase();
            const value = args[2];

            if (type === "threshold") {
                const val = parseInt(value);
                if (isNaN(val) || val < 2) return message.reply("Invalid threshold.");
                guildConfig.threshold = val;
            } else if (type === "window") {
                const val = parseInt(value);
                if (isNaN(val) || val < 5) return message.reply("Invalid time window.");
                guildConfig.timeWindow = val;
            } else if (type === "action") {
                if (!["lock", "kick", "ban"].includes(value?.toLowerCase())) return message.reply("Valid actions: `lock`, `kick`, `ban`.");
                guildConfig.action = value.toLowerCase();
            } else if (type === "age") {
                const val = parseInt(value);
                if (isNaN(val)) return message.reply("Invalid age.");
                guildConfig.minAge = val;
            } else if (type === "avatar") {
                guildConfig.avatarRequired = value?.toLowerCase() === "true" || value?.toLowerCase() === "on";
            } else {
                return message.reply({
                    components: [V2.container([
                        V2.heading("Anti-Raid Setup Guide", 3),
                        `\`!antiraid set threshold <number>\` - Default: 5\n` +
                        `\`!antiraid set window <seconds>\` - Default: 10\n` +
                        `\`!antiraid set action <lock|kick|ban>\` - Default: lock\n` +
                        `\`!antiraid set age <days>\` - Default: 1 (min account age)\n` +
                        `\`!antiraid set avatar <on|off>\` - Default: off`
                    ])]
                });
            }

            config[message.guild.id] = guildConfig;
            fastCache.set(DB_PATH, config);
            return message.reply({ components: [V2.container(["✅ **Configuration Updated.** Run `!antiraid status` to verify."])] });
        }

        // ───── UNLOCK ─────
        if (subCommand === "unlock") {
            const channels = message.guild.channels.cache.filter(c => c.type === 0);
            let unlocked = 0;

            for (const [id, ch] of channels) {
                await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).catch(() => {});
                unlocked++;
            }

            return message.reply({
                components: [V2.container([
                    V2.section([
                        "🔓 SERVER RECOVERY COMPLETE",
                        `Emergency lockdown lifted for **${unlocked}** channels.`
                    ])
                ])]
            });
        }

        // ───── DEFAULT HELP ─────
        const helpContainer = V2.container([
            V2.section(["🛡️ ANTI-RAID COMMANDS", "Advanced join-flood and automation defense."]),
            V2.heading("Management", 3),
            `> \`!antiraid on | off\`\n> \`!antiraid set <param> <val>\`\n> \`!antiraid status\`\n> \`!antiraid unlock\``,
            V2.heading("Parameters", 3),
            `> \`threshold\`, \`window\`, \`action\`, \`age\`, \`avatar\``
        ]);

        return message.reply({ components: [helpContainer] });
    }
};
