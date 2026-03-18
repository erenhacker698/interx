const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "serverstats.json");

function loadData() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2)); return {}; }
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch { return {}; }
}
function saveData(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

module.exports = {
    name: "serverstats",
    description: "Setup server statistic counters (VC display)",
    usage: "!serverstats setup | delete",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const isOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID)) || message.guild.ownerId === message.author.id;
        if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return message.reply({ components: [V2.container(["🚫 **Administrator permissions required.**"])] });

        const sub = args[0]?.toLowerCase();

        if (sub === "setup") {
            const tempMsg = await message.reply({ components: [V2.container(["📊 **Setting up Server Stats...** Creating stat channels."])] });
            try {
                const category = await message.guild.channels.create({
                    name: "📊 Server Stats 📊",
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [{ id: message.guild.id, deny: [PermissionsBitField.Flags.Connect], allow: [PermissionsBitField.Flags.ViewChannel] }]
                });
                const totalMembers = await message.guild.channels.create({ name: `Total Members: ${message.guild.memberCount}`, type: ChannelType.GuildVoice, parent: category.id });
                const botCount = message.guild.members.cache.filter(m => m.user.bot).size;
                const bots = await message.guild.channels.create({ name: `Bots: ${botCount}`, type: ChannelType.GuildVoice, parent: category.id });

                const data = loadData();
                data[message.guild.id] = { categoryId: category.id, totalId: totalMembers.id, botsId: bots.id };
                saveData(data);

                return tempMsg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("📊 SERVER STATS CREATED").setDescription("> **Total Members** channel created\n> **Bots** channel created\n\nChannels update every **10 minutes**.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            } catch (e) {
                return tempMsg.edit({ components: [V2.container(["❌ Failed to create channels. Check my permissions."])] });
            }
        }

        if (sub === "delete") {
            const data = loadData();
            if (!data[message.guild.id]) return message.reply({ components: [V2.container(["⚠️ No server stats setup found."])] });
            const config = data[message.guild.id];
            try {
                const arr = [config.totalId, config.botsId, config.categoryId].map(id => message.guild.channels.cache.get(id)).filter(Boolean);
                await Promise.all(arr.map(c => c.delete().catch(() => { })));
            } catch (e) { }
            delete data[message.guild.id];
            saveData(data);
            return message.reply({ components: [V2.container(["🗑️ **Server Stats removed.**"])] });
        }

        return message.reply({ components: [V2.container(["**Usage:**\n> `!serverstats setup` — Create stat display channels\n> `!serverstats delete` — Remove them"])] });
    }
};
