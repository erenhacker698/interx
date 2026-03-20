const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const DB_PATH = path.join(__dirname, "../data/giveaways.json");

module.exports = {
    name: "giveaway",
    description: "🎁 interX Sovereign Giveaway System",
    aliases: ["gstart", "gway", "gw"],
    usage: "!giveaway <start | reroll | end | list>",
    permissions: [PermissionsBitField.Flags.ManageEvents],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageEvents) && !global.V2.botOwnerId === message.author.id) {
            return message.reply("🚫 **Unauthorized:** `Manage Events` clearance required.");
        }

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === "start") {
            // !giveaway start 1h 1w Nitro Basic
            const timeStr = args[1];
            const winnerCount = parseInt(args[2]);
            const prize = args.slice(3).join(" ");

            if (!timeStr || isNaN(winnerCount) || !prize) {
                return message.reply("⚠️ **Usage:** `!giveaway start <time e.g. 1h/10m> <winners e.g. 1> <prize>`");
            }

            const duration = parseTime(timeStr);
            if (!duration) return message.reply("❌ **Invalid Time Format:** Use `10m`, `1h`, or `1d`.");

            const endTime = Date.now() + duration;

            const embed = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle(`🎁 GIVEAWAY: ${prize.toUpperCase()}`)
                .setDescription(`### **Protocol: HIGH_VALUE_TRANSMISSION**\n\n> 👤 **Host:** ${message.author}\n> 🏆 **Winners:** \`${winnerCount}\`\n> ⏳ **Ends:** <t:${Math.floor(endTime / 1000)}:R>\n\n*Press the button below to register your DNA for the draw.*`)
                .setThumbnail("https://media.discordapp.net/attachments/1093150036663308318/1113885885264662608/gift.gif")
                .setFooter({ text: "interX Sovereign • Luck Protocol" })
                .setTimestamp(endTime);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`gw_enter`)
                    .setLabel("ENTER GIVEAWAY")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("🎟️")
            );

            const gwMsg = await message.channel.send({ content: "🎉 **GIVEAWAY INITIATED** 🎉", embeds: [embed], components: [row] });
            
            // Save to DB
            saveGiveaway({
                id: gwMsg.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
                prize: prize,
                winnerCount: winnerCount,
                endTime: endTime,
                participants: [],
                status: "active"
            });

            if (message.deletable) await message.delete().catch(() => {});
            return;
        }

        if (subCommand === "reroll") {
            const messageId = args[1];
            if (!messageId) return message.reply("❌ **ERROR:** Provide the Giveaway Message ID.");

            const gw = getGiveaway(messageId);
            if (!gw) return message.reply("❌ **ERROR:** Giveaway not found in registry.");
            if (gw.status !== "ended") return message.reply("❌ **ERROR:** Only finished giveaways can be rerolled.");

            const winner = selectWinners(gw.participants, gw.winnerCount);
            if (!winner.length) return message.reply("❌ **ERROR:** No valid participants found for reroll.");

            return message.channel.send(`🎲 **REROLL COMPLETE:** Congratulations ${winner.join(", ")}! You are the new winner(s) of **${gw.prize}**!`);
        }

        if (subCommand === "list") {
            const gws = getAllActive(message.guild.id);
            if (gws.length === 0) return message.reply("✅ **REGISTRY CLEAR:** No active giveaways in this sector.");

            const list = gws.map(g => `> • **${g.prize}** (\`${g.id}\`) - Ends <t:${Math.floor(g.endTime / 1000)}:R>`).join("\n");
            return message.reply({ embeds: [new EmbedBuilder().setColor("#df0000").setTitle("🎁 ACTIVE GIVEAWAY NODES").setDescription(list)] });
        }

        // Help
        return message.reply({
            components: [V2.container([
                "🎁 PREMIER GIVEAWAY INTERFACE",
                "### **Operations Commands**",
                `> \`!giveaway start 1h 1 Nitro\` — Launch new node\n> \`!giveaway reroll <msgId>\` — Choose new winners\n> \`!giveaway list\` — Monitor active nodes`,
                "*interX Sovereign Protocol*"
            ])]
        });
    },

    // ───── INITIALIZE AUTO-ENDER ─────
    init(client) {
        setInterval(async () => {
            const giveaways = loadAll();
            const now = Date.now();
            const active = giveaways.filter(g => g.status === "active" && g.endTime <= now);

            for (const gw of active) {
                try {
                    const channel = await client.channels.fetch(gw.channelId).catch(() => null);
                    if (!channel) {
                        gw.status = "abandoned";
                        continue;
                    }

                    const message = await channel.messages.fetch(gw.id).catch(() => null);
                    if (!message) {
                        gw.status = "deleted";
                        continue;
                    }

                    const winners = selectWinners(gw.participants, gw.winnerCount);
                    
                    const endEmbed = EmbedBuilder.from(message.embeds[0])
                        .setTitle(`🎁 GIVEAWAY ENDED: ${gw.prize.toUpperCase()}`)
                        .setColor("#333333") // Gray for ended
                        .setDescription(`### **Protocol: SELECTION_COMPLETE**\n\n> 🏆 **Winner(s):** ${winners.length > 0 ? winners.join(", ") : "None"}\n\n*Transmission closed. Winners have been authenticated via Sovereign Luck Protocol.*`)
                        .setTimestamp();

                    await message.edit({ embeds: [endEmbed], components: [] });

                    if (winners.length > 0) {
                        await channel.send(`🎊 **GIVEAWAY CONCLUDED** 🎊\nCongratulations ${winners.join(", ")}! You have won **${gw.prize}**!`);
                    } else {
                        await channel.send(`⚠️ **GIVEAWAY TERMINATED:** No valid participants detected for **${gw.prize}**.`);
                    }

                    gw.status = "ended";
                } catch (err) {
                    console.error("[Giveaway End Error]:", err);
                    gw.status = "error";
                }
            }
            if (active.length > 0) saveAllJSON(giveaways);
        }, 15000); // Check every 15 seconds
    }
};

/**
 * BUTTON INTERACTION HANDLER (Triggered by index.js button handler)
 */
global.handleGiveawayEntry = async (interaction) => {
    const msgId = interaction.message.id;
    const giveaways = loadAll();
    const gw = giveaways.find(g => g.id === msgId);

    if (!gw || gw.status !== "active") {
        return interaction.reply({ content: "❌ **ERROR:** This giveaway has already concluded or is invalid.", ephemeral: true });
    }

    if (gw.participants.includes(interaction.user.id)) {
        return interaction.reply({ content: "⚠️ **ALREADY REGISTERED:** Your DNA sequence is already in the prize pool.", ephemeral: true });
    }

    gw.participants.push(interaction.user.id);
    saveAllJSON(giveaways);
    return interaction.reply({ content: "✅ **SUCCESS:** You have successfully entered the giveaway pool.", ephemeral: true });
};


// ───── DATABASE UTILS ─────
function loadAll() {
    if (!fs.existsSync(DB_PATH)) return [];
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { return []; }
}
function saveGiveaway(gw) {
    const all = loadAll();
    all.push(gw);
    saveAllJSON(all);
}
function saveAllJSON(data) {
    if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function getGiveaway(id) { return loadAll().find(g => g.id === id); }
function getAllActive(guildId) { return loadAll().filter(g => g.guildId === guildId && g.status === "active"); }

function selectWinners(participants, count) {
    if (!participants || participants.length === 0) return [];
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(id => `<@${id}>`);
}

function parseTime(str) {
    const amount = parseInt(str);
    const unit = str.slice(-1).toLowerCase();
    if (unit === "m") return amount * 60000;
    if (unit === "h") return amount * 3600000;
    if (unit === "d") return amount * 86400000;
    return null;
}
