const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, BOT_DEV_ID, ERROR_COLOR } = require("../config");

module.exports = {
    name: "spamblacklist",
    description: "Manage the automatic spam blacklist.",
    aliases: ["spmbl", "spamlist", "sbl"],
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
                    "You do not have permission to manage the Spam Blacklist."
                ], ERROR_COLOR)]
            });
        }

        const DB_PATH = path.join(__dirname, "../data/spamblacklist.json");
        let spambl = {};
        if (fs.existsSync(DB_PATH)) {
            try { spambl = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || (subCommand !== "remove" && subCommand !== "list")) {
            const container = V2.container([
                V2.section([
                    "🤖 SPAM INTELLIGENCE REPO",
                    "Manage auto-bans from the rate limiter."
                ], "https://cdn-icons-png.flaticon.com/512/2622/2622112.png"),
                "🛠️ OPERATIONS",
                `> \`!spmbl list\` - **View Active Spammers**\n> \`!spmbl remove <ID>\` - **Pardon Spammer**`,
                "*interX Automated Defense*"
            ]);
            return message.reply({ content: null, components: [container] });
        }

        if (subCommand === "list") {
            const keys = Object.keys(spambl);
            if (keys.length === 0) return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("✅ REGISTRY CLEAN").setDescription("No active spam bans.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });

            const listItems = keys.map((id, i) => {
                const entry = spambl[id];
                const exp = entry.expires ? `<t:${Math.floor(entry.expires / 1000)}:R>` : "Never";
                return `**${i + 1}.** \`${id}\` - Ends: ${exp}`;
            });

            const listString = listItems.join("\n");

            const container = V2.container([
                V2.heading(`🤖 SPAM BLACKLIST (${keys.length})`, 2),
                V2.text(listString.length > 2000 ? listString.substring(0, 2000) + "..." : listString),
                "*interX Global Security*"
            ]);

            return message.reply({ content: null, components: [container] });
        }

        if (subCommand === "remove") {
            const targetId = args[1];
            if (!targetId) return message.reply("❌ Provide ID.");

            if (!spambl[targetId]) return message.reply({
                content: null,
                components: [V2.container(["⚠️ NOT LISTED", "User is not in the spam list."], require("../config").WARN_COLOR)]
            });

            delete spambl[targetId];
            fs.writeFileSync(DB_PATH, JSON.stringify(spambl, null, 2));

            const container = V2.container([
                "🔓 PARDON GRANTED",
                `**User ID:** \`${targetId}\`\n**Status:** Auto-Ban Revoked`,
                "User removed from spam blacklist."
            ]);

            return message.reply({ content: null, components: [container] });
        }
    }
};
