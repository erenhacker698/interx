const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "addowner",
    description: "Add a user to the Extra Owners list (Server/Bot Owner only)",
    aliases: ["trust", "addtrust"],

    async execute(message, args) {
        // Need access to main process for DB and Cache
        const main = require("../index");

        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⛔ **ACCESS DENIED:** This protocol is restricted to the Lead Architect or Node Monarch.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.users.first() || await message.client.users.fetch(args[0]).catch(() => null);

        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Fault:** Please specify a valid entity to elevate.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (target.bot) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⛔ **SECURITY_FAULT:** Sovereign authority cannot be delegated to an automated entity. Trust must be human.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const accountAge = Date.now() - target.createdTimestamp;
        const minAge = 1000 * 60 * 60 * 24 * 7; // 7 Days
        const hasAvatar = !!target.avatar;

        if (accountAge < minAge || !hasAvatar) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⛔ **SECURITY_ALERT:** This account lacks the required maturity or identity verification to hold Sovereign Authority. Trust requires a verified human presence (>7d age + Avatar).").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        // 1. DATABASE SAVE (For 1M+ Scale)
        if (process.env.DATABASE_URL) {
            try {
                await main.db.query(
                    'INSERT INTO extra_owners (guild_id, user_id, added_by) VALUES ($1, $2, $3) ON CONFLICT (guild_id, user_id) DO NOTHING',
                    [message.guild.id, target.id, message.author.id]
                );
                await main.refreshOwnerCache(message.guild.id);
            } catch (err) {
                console.error("❌ SQL AddOwner Error:", err.message);
            }
        }

        // 2. LEGACY JSON SAVE (Fallback)
        const DB_PATH = path.join(__dirname, "../data/owners.json");
        let legacyDb = {};
        if (fs.existsSync(DB_PATH)) {
            try { legacyDb = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }

        const guildOwners = legacyDb[message.guild.id] || [];
        const isAlreadyOwner = guildOwners.some(o => (typeof o === 'string' ? o : o.id) === target.id);

        if (!isAlreadyOwner) {
            guildOwners.push({
                id: target.id,
                addedBy: message.author.id,
                addedAt: Date.now()
            });
            legacyDb[message.guild.id] = guildOwners;
            fs.writeFileSync(DB_PATH, JSON.stringify(legacyDb, null, 2));
        }

        const container = V2.container([
            V2.section([
                "👑 EXTRA OWNER APPOINTED",
                V2.text(
                    `### **[ AUTHORITY_GRANTED ]**\n` +
                    `> **Entity:** ${target} (\`${target.id}\`)\n` +
                    `> **Status:** \`ACTING OWNER\`\n` +
                    `> **Promoter:** ${message.author}\n\n` +
                    `*This user now bypasses all restrictions and possesses administrative parity with the Server Owner within this node.*`
                )
            ], target.displayAvatarURL({ dynamic: true })),
            "*interX • Trust Chain Initiated*"
        ]);

        return message.channel.send({ content: null, components: [container] });
    }
};
