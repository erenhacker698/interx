const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

const DB_PATH = path.join(__dirname, "../data/vdefend.json");

function loadDB() {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "vundefend",
    description: "Remove protection from a user",
    usage: "!vundefend @user",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply("⚠️ User not found.");

        const data = loadDB();
        if (!data[message.guild.id]) data[message.guild.id] = [];

        if (!data[message.guild.id].includes(target.id)) {
            return message.reply("⚠️ User is not defended.");
        }

        data[message.guild.id] = data[message.guild.id].filter(id => id !== target.id);
        saveDB(data);

        message.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🛡️ DEFENSE PROTOCOL DISENGAGED").setDescription(`*interX • Anti-Move System*`).setFooter({ text: "interX • Security" }).setTimestamp()] });
    }
};
