const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "delowner",
    description: "Remove a user from the Extra Owners list (Server/Bot Owner only)",
    aliases: ["untrust", "removetrust", "deltrust"],

    async execute(message, args) {
        const main = require("../index");

        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⛔ **ACCESS DENIED:** Revocation protocols are restricted to the Lead Architect or Node Monarch.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);

        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Fault:** Please specify a valid entity to revoke.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        // 1. DATABASE REMOVAL
        if (process.env.DATABASE_URL) {
            try {
                await main.db.query(
                    'DELETE FROM extra_owners WHERE guild_id = $1 AND user_id = $2',
                    [message.guild.id, target.id]
                );
                await main.refreshOwnerCache(message.guild.id);
            } catch (err) {
                console.error("❌ SQL DelOwner Error:", err.message);
            }
        }

        // 2. LEGACY JSON REMOVAL
        const DB_PATH = path.join(__dirname, "../data/owners.json");
        let legacyDb = {};
        if (fs.existsSync(DB_PATH)) {
            try { legacyDb = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }

        let guildOwners = legacyDb[message.guild.id] || [];
        const index = guildOwners.findIndex(o => (typeof o === 'string' ? o : o.id) === target.id);

        if (index !== -1) {
            guildOwners.splice(index, 1);
            legacyDb[message.guild.id] = guildOwners;
            fs.writeFileSync(DB_PATH, JSON.stringify(legacyDb, null, 2));
        }

        const container = V2.container([
            V2.section([
                "🗑️ EXTRA OWNER REVOKED",
                V2.text(
                    `### **[ AUTHORITY_TERMINATED ]**\n` +
                    `> **Target:** ${target.tag} (\`${target.id}\`)\n` +
                    `> **Status:** \`REVOKED\`\n` +
                    `> **Revoked By:** ${message.author}\n\n` +
                    `> *Action: All sovereign acting privileges have been purged from the node registry.*`
                )
            ], target.displayAvatarURL({ dynamic: true })),
            "*interX • Trust Revocation Complete*"
        ]);

        return message.channel.send({ content: null, components: [container] });
    }
};
