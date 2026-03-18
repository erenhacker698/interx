const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/suggestions.json");

function loadData() {
    if (!fs.existsSync(DB_PATH)) {
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        return {};
    }
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch { return {}; }
}

function saveData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "suggest",
    description: "💡 SUBMIT OR SETUP SUGGESTIONS",
    aliases: ["suggestion", "idea"],

    async execute(message, args) {
        if (!args[0]) return message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("ℹ️ SUGGESTION SYSTEM").setDescription("Usage: `!suggest <idea>`\nSetup: `!suggest setup #channel`").setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        const sub = args[0].toLowerCase();

        // SETUP
        if (sub === "setup" || sub === "set") {
            const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
            const isServerOwner = message.guild.ownerId === message.author.id;

            if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply({
                    content: null,
                    embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 PERMISSION DENIED").setDescription("You need `Manage Guild` permission.").setFooter({ text: "interX • Security" }).setTimestamp()]
                });
            }
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            if (!channel) return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ INVALID CHANNEL").setDescription("Please mention a valid channel.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });

            const data = loadData();
            data[message.guild.id] = channel.id;
            saveData(data);

            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("✅ SYSTEM CONFIGURED").setDescription(`**Suggestion Channel Set:** ${channel}`).setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        // SUBMIT SUGGESTION
        const data = loadData();
        const channelId = data[message.guild.id];

        if (!channelId) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ SYSTEM OFFLINE").setDescription("Suggestions are not set up! Ask an admin to run `!suggest setup #channel`.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) return message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ ERROR").setDescription("Suggestion channel not found. Please re-setup.").setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        const content = args.join(" ");

        // Convert Suggestion Embed to V2 Container
        const suggestionContainer = V2.container([
            V2.section([
                "💡 NEW SUGGESTION",
                V2.text(content)
            ], message.author.displayAvatarURL()),
            "📊 STATUS",
            "Voting in progress...",
            `*Submitted by ${message.author.tag} • interX Feedback*`
        ]);

        try {
            const sentMsg = await channel.send({ content: null, components: [suggestionContainer] });
            await sentMsg.react("👍");
            await sentMsg.react("👎");

            await message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("✅ SUGGESTION SENT").setDescription("Your idea has been submitted for review.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        } catch (e) {
            console.error(e);
            message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("❌ ERROR").setDescription("Error sending suggestion.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }
    }
};
