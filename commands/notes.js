const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/user_notes.json");

module.exports = {
    name: "notes",
    description: "📔 interX Sovereign Digital Notebook (Private)",
    aliases: ["note", "n", "memo"],
    usage: "!notes <add | delete | list | clear>",

    async execute(message, args) {
        const subCommand = args[0]?.toLowerCase();
        const data = loadData();
        const userId = message.author.id;

        if (!data[userId]) data[userId] = [];

        // 1. ADD
        if (subCommand === "add" || subCommand === "new") {
            const content = args.slice(1).join(" ");
            if (!content) return message.reply("❌ **INPUT_ERROR:** No data provided for transmission. Usage: `!note add <content>`");

            if (data[userId].length >= 15) return message.reply("⚠️ **BUFFER_OVERFLOW:** Your notebook node is at maximum capacity (15/15 nodes). Clear some notes first.");

            const noteId = Date.now().toString(36).toUpperCase();
            data[userId].push({ id: noteId, content, timestamp: Date.now() });
            saveData(data);

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("📔 NOTE REGISTERED")
                .setDescription(`### **Protocol: DATA_SAVED**\n> **ID:** \`#${noteId}\`\n> **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n> **Data Packet:** ${content.substring(0, 1000)}`)
                .setFooter({ text: "interX Sovereign • Private Memory Node" })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // 2. LIST
        if (!subCommand || subCommand === "list") {
            const userNotes = data[userId];
            if (userNotes.length === 0) return message.reply("📔 **REGISTRY EMPTY:** No data packets found in your private sector.");

            const notebook = userNotes.map((n, i) => `**${i + 1}.** \`#${n.id}\` — ${n.content.length > 50 ? n.content.substring(0, 50) + "..." : n.content}`).join("\n");

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle(`📔 PRIVATE NOTEBOOK • [ ${userNotes.length} ]`)
                .setDescription(`### **Protocol: NODES_RETRIEVED**\n\n${notebook}\n\n*Use \`!note delete <index>\` to purge data.*`)
                .setFooter({ text: "interX Sovereign • Private Memory Node" })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // 3. DELETE
        if (subCommand === "delete" || subCommand === "remove" || subCommand === "del") {
            const index = parseInt(args[1]) - 1;
            if (isNaN(index) || index < 0 || index >= data[userId].length) {
                return message.reply("❌ **INDEX_ERROR:** Indicate the valid node number from your list. Usage: `!note delete <1-15>`");
            }

            const removed = data[userId].splice(index, 1);
            saveData(data);

            return message.reply(`🗑️ **PURGE COMPLETE:** Node \`#${removed[0].id}\` has been permanently deleted from storage.`);
        }

        // 4. CLEAR
        if (subCommand === "clear" || subCommand === "wipe") {
            data[userId] = [];
            saveData(data);
            return message.reply("☢️ **STORAGE WIPED:** All private memory nodes in your sector have been neutralized.");
        }

        // Help
        return message.reply({
            components: [V2.container([
                "📔 SOVEREIGN PRIVATE NOTEBOOK",
                "### **Memory Access Protocol**",
                `> \`!note add <content>\` — Store new packet\n> \`!note list\` — View all stored nodes\n> \`!note delete <#>\` — Purge specific node\n> \`!note clear\` — Neutralize all data`,
                "*interX Private Memory System*"
            ])]
        });
    }
};

function loadData() {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { return {}; }
}
function saveData(data) {
    if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
