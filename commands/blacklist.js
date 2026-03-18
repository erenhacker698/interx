const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, BOT_DEV_ID, ERROR_COLOR, WARN_COLOR } = require("../config");

module.exports = {
    name: "blacklist",
    description: "Globally blacklist a user from using the bot and joining servers.",
    aliases: ["bl"],
    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        const ownersDbPath = path.join(__dirname, "../data/owners.json");
        let extraOwners = [];
        if (fs.existsSync(ownersDbPath)) {
            try {
                const db = JSON.parse(fs.readFileSync(ownersDbPath, "utf8"));
                extraOwners = db[message.guild.id] || [];
            } catch (e) { }
        }
        const isExtraOwner = extraOwners.includes(message.author.id);

        if (!isBotOwner && !isServerOwner && !isExtraOwner) {
            return message.reply({
                components: [V2.container([
                    "🚫 ACCESS DENIED",
                    "You do not have permission to manage the Global Blacklist."
                ], ERROR_COLOR)]
            });
        }

        const DB_PATH = path.join(__dirname, "../data/blacklist.json");

        // Load & Migrate
        let blacklist = {};
        if (fs.existsSync(DB_PATH)) {
            try {
                const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
                if (Array.isArray(data)) {
                    // MIGRATION: Convert Array to Object
                    data.forEach(id => blacklist[id] = { reason: "Legacy Ban", expires: null, timestamp: Date.now() });
                    fs.writeFileSync(DB_PATH, JSON.stringify(blacklist, null, 2));
                    console.log("🔄 Migrated Blacklist to V2 Schema");
                } else {
                    blacklist = data;
                }
            } catch (e) { }
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || (subCommand !== "add" && subCommand !== "remove" && subCommand !== "list")) {
            const container = V2.container([
                V2.section([
                    "🚫 GLOBAL BLACKLIST CONTROL",
                    "Manage the global security blocklist."
                ], "https://cdn-icons-png.flaticon.com/512/3524/3524812.png"),
                "🛠️ OPERATIONS",
                `> \`!blacklist add <ID> [days] [reason]\` - **Block User**\n> \`!blacklist remove <ID>\` - **Unblock User**\n> \`!blacklist list\` - **View Registry**`,
                "*interX Global Security Network*"
            ]);
            return message.reply({ content: null, components: [container] });
        }

        if (subCommand === "add") {
            let targetId = args[1];
            if (!targetId) return message.reply({
                content: null,
                components: [V2.container(["❌ MISSING TARGET", "Please provide a User ID or Mention."], ERROR_COLOR)]
            });

            // Extract ID from mention if present
            const mentionMatch = targetId.match(/^<@!?(\d{17,20})>$/);
            if (mentionMatch) targetId = mentionMatch[1];

            if (!/^\d{17,20}$/.test(targetId)) return message.reply({
                content: null,
                components: [V2.container(["❌ INVALID ID", "Please provide a valid User ID (17-20 digits)."], ERROR_COLOR)]
            });

            if (blacklist[targetId]) return message.reply({
                content: null,
                components: [V2.container(["⚠️ ALREADY LISTED", "User is already in the blacklist."], WARN_COLOR)]
            });

            // Parse Duration (optional)
            let days = 0;
            let reasonStartIndex = 2; // Default: args[0]=add, args[1]=ID, args[2]=Reason OR Days

            // Check if args[2] is a number (days)
            if (args[2] && !isNaN(args[2])) {
                days = parseInt(args[2]);
                reasonStartIndex = 3;
            }

            const reason = args.slice(reasonStartIndex).join(" ") || "Manual Ban";
            const expires = days > 0 ? Date.now() + (days * 24 * 60 * 60 * 1000) : null;
            const expiryText = days > 0 ? `${days} Days` : "Permanent";
            const expiryDate = expires ? `<t:${Math.floor(expires / 1000)}:R>` : "Never";

            try {
                const dmContainer = new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 SECURITY ALERT").setDescription(`You have been **globally blacklisted** from interX services.`).addFields({ name: "📋 ACCESS REVOKED", value: `> **Reason:** ${reason}\n> **Duration:** ${expiryText}` }).addFields({ name: "\u200b", value: `*interX Global Security*` }).setFooter({ text: "interX • Security" }).setTimestamp();

                const user = await message.client.users.fetch(targetId).catch(() => null);
                if (user) await user.send({ content: null, components: [dmContainer] }).catch(() => { });
            } catch (e) { }

            blacklist[targetId] = {
                reason: reason,
                expires: expires,
                timestamp: Date.now()
            };
            fs.writeFileSync(DB_PATH, JSON.stringify(blacklist, null, 2));

            const container = V2.container([
                V2.section(
                    [
                        "🚫 SECURITY ACTION: BLOCK",
                        `**Target:** <@${targetId}>\n**ID:** \`${targetId}\`\n**Status:** Globally Blacklisted`
                    ],
                    "https://cdn-icons-png.flaticon.com/512/3524/3524812.png" // Shield
                ),
                "📝 DETAILS",
                `> **Duration:** ${expiryText} (${expiryDate})\n> **Reason:** ${reason}`,
                "*interX Global Security Network*"
            ]);

            return message.reply({ content: null, components: [container] });
        }

        if (subCommand === "remove") {
            const targetId = args[1];
            if (!targetId) return message.reply("❌ Provide ID.");

            if (!blacklist[targetId]) return message.reply({
                content: null,
                components: [V2.container(["⚠️ NOT LISTED", "User is not in the blacklist."], WARN_COLOR)]
            });

            delete blacklist[targetId];
            fs.writeFileSync(DB_PATH, JSON.stringify(blacklist, null, 2));

            const container = V2.container([
                "🔓 SECURITY ACTION: UNBLOCK",
                `**User ID:** \`${targetId}\`\n**Status:** Access Restored`,
                "The target has been removed from the blacklist."
            ]);

            return message.reply({ content: null, components: [container] });
        }

        if (subCommand === "list") {
            const keys = Object.keys(blacklist);
            if (keys.length === 0) return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("📋 BLACKLIST EMPTY").setDescription("No users are currently blacklisted.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });

            // Simple pagination or truncation
            const listItems = keys.map((id, i) => {
                const entry = blacklist[id];
                const exp = entry.expires ? `<t:${Math.floor(entry.expires / 1000)}:R>` : "Never";
                return `**${i + 1}.** \`${id}\` (${entry.reason}) - Exp: ${exp}`;
            });

            const listString = listItems.join("\n");

            const container = V2.container([
                V2.heading(`🚫 GLOBAL BLACKLIST (${keys.length})`, 2),
                V2.text(listString.length > 2000 ? listString.substring(0, 2000) + "..." : listString),
                "*interX Global Security*"
            ]);

            return message.reply({ content: null, components: [container] });
        }
    }
};
