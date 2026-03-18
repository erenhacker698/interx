const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/sticky.json");
function loadData() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2)); return {}; }
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch { return {}; }
}
function saveData(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

module.exports = {
    name: "stick",
    description: "Pin a sticky message to the bottom of a channel",
    aliases: ["sticky", "stickymsg"],
    permissions: [PermissionsBitField.Flags.ManageMessages],

    async execute(message, args) {
        const isOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID)) || message.guild.ownerId === message.author.id;
        if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return message.reply({ components: [V2.container(["🚫 You need `Manage Messages` permission."])] });

        const sub = args[0]?.toLowerCase();

        if (sub === "off" || sub === "stop" || sub === "delete") {
            const data = loadData();
            if (data[message.channel.id]) {
                delete data[message.channel.id];
                saveData(data);
                return message.reply({ components: [V2.container(["✅ **Sticky Message Removed.**"])] });
            }
            return message.reply({ components: [V2.container(["⚠️ No sticky message active in this channel."])] });
        }

        const content = args.join(" ");
        if (!content) return message.reply({ components: [V2.container(["**Usage:** `!stick <message>` or `!stick off`"])] });

        const data = loadData();
        data[message.channel.id] = { content, lastId: null };
        saveData(data);

        const sent = await message.channel.send({
            components: [V2.container([
                "📌 STICKY MESSAGE",
                V2.text(content),
                "*Use `!stick off` to remove this sticky message.*"
            ])]
        });

        data[message.channel.id].lastId = sent.id;
        saveData(data);
        message.delete().catch(() => { });
    }
};
