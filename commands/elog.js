const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "elog",
    description: "Setup global/universal logging channels (Owner Only).",
    aliases: ["elogs", "glog", "globallog"],
    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Access Denied:** Restricted to the Lead Architect.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const DB_PATH = path.join(__dirname, "../data/elogs.json");
        if (!fs.existsSync(path.join(__dirname, "../data"))) fs.mkdirSync(path.join(__dirname, "../data"));

        let data = {};
        if (fs.existsSync(DB_PATH)) {
            try { data = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }

        const type = args[0]?.toLowerCase();
        const subCommand = args[1]?.toLowerCase();

        const validTypes = [
            "message", "mod", "verify", "whitelist", "security", "server",
            "role", "file", "voice", "member", "action", "channel",
            "invite", "ticket", "admin", "quark", "raid", "misuse", "antinuke"
        ];

        if (!type || !validTypes.includes(type) || (subCommand !== "set" && subCommand !== "off")) {
            const sections = [
                V2.section([
                    "🌍 UNIVERSAL LOGGING OS",
                    "Configure central intelligence streams for all network nodes."
                ], "https://cdn-icons-png.flaticon.com/512/3039/3039535.png"),
                V2.text(
                    "> `!elog mod set #chan` | `!elog message set #chan`\n" +
                    "> `!elog antinuke set #chan` | `!elog raid set #chan`\n" +
                    "> `!elog admin set #chan` | `!elog security set #chan`"
                ),
                "*interX • Global Intelligence Agency*"
            ];

            return message.reply({ content: null, components: [V2.container(sections, "#FF00FF")] });
        }

        if (subCommand === "set") {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[2]);
            if (!channel || channel.type !== 0) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Invalid Target:** Please mention a valid text channel.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            }

            data[type] = channel.id;
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

            const successContainer = V2.container([
                V2.section([
                    V2.heading(`🌍 GLOBAL ${type.toUpperCase()} FEED CONNECTED`, 2),
                    `Intel from all shards for **${type}** operations will now stream to ${channel}.`
                ], "https://cdn-icons-png.flaticon.com/512/190/190411.png")
            ], "#ec0000");

            return message.reply({ content: null, components: [successContainer] });
        }

        if (subCommand === "off") {
            if (data[type]) {
                delete data[type];
                fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription(`🔒 **Global ${type.toUpperCase()} Feed** disconnected.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
            }
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription(`ℹ️ **Status:** Global ${type.toUpperCase()} feed is already offline.`).setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
