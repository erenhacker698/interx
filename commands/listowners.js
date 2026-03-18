const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "listowners",
    description: "Interactive Sovereign Hierarchy Panel",
    aliases: ["owners", "elo", "authority"],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⛔ **ACCESS DENIED:** Hierarchy manifestations are restricted to the Lead Architect or Node Monarch.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try {
            const globalOwner = message.client.users.cache.get(BOT_OWNER_ID) || await message.client.users.fetch(BOT_OWNER_ID).catch(() => null);
            const serverOwner = await message.guild.fetchOwner().catch(() => null);

            const OWNERS_DB = path.join(__dirname, "../data/owners.json");
            let extraOwnersRaw = [];
            if (fs.existsSync(OWNERS_DB)) {
                try {
                    const db = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
                    extraOwnersRaw = db[message.guild.id] || [];
                } catch (e) { }
            }

            let currentPage = 0;

            const getPanel = async (pageIdx) => {
                const components = [];
                let color = "#000000";

                if (pageIdx === 0) {
                    components.push(
                        V2.section([
                            "🌐 PEAK AUTHORITY: GLOBAL ARCHITECT",
                            V2.text(
                                `### **[ SUPREME_DEITY_FOUNDATION ]**\n\n` +
                                `**The Architect** holds absolute dominion over the bot kernel and all connected server nodes.\n\n` +
                                `> **Identity:** ${globalOwner ? `**${globalOwner.tag}**` : "Unknown"}\n` +
                                `> **Sovereign ID:** \`${BOT_OWNER_ID}\`\n` +
                                `> **Status:** \`ETERNAL ALPHA\``
                            )
                        ], globalOwner ? globalOwner.displayAvatarURL({ dynamic: true, size: 512 }) : null),
                        "*interX • Layer 0 - Core Foundation*"
                    );
                    color = "#000000";
                } else if (pageIdx === 1) {
                    components.push(
                        V2.section([
                            "👑 DOMINION AUTHORITY: SERVER OWNER",
                            V2.text(
                                `### **[ THE_KING_PROTOCOL ]**\n\n` +
                                `The **Server Owner** reigns over this specific server shard with absolute delegated command.\n\n` +
                                `> **Monarch:** ${serverOwner ? `**${serverOwner.user.tag}**` : "Unknown"}\n` +
                                `> **Discord ID:** \`${message.guild.ownerId}\`\n` +
                                `> **Ascension:** <t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>\n\n` +
                                `> **Status:** \`ACTIVE SOVEREIGN\``
                            )
                        ], serverOwner ? serverOwner.user.displayAvatarURL({ dynamic: true, size: 512 }) : null),
                        "*interX • Layer 1 - Server Authority*"
                    );
                    color = "#FFD700";
                } else {
                    let extraOwnersList = extraOwnersRaw.length === 0
                        ? "\n> *No individuals currently hold delegated sovereign authority.*"
                        : (await Promise.all(extraOwnersRaw.map(async (o) => {
                            const id = typeof o === 'string' ? o : o.id;
                            const user = message.client.users.cache.get(id) || await message.client.users.fetch(id).catch(() => null);
                            const tag = user ? user.tag : "Unknown Entity";
                            const addedBy = o.addedBy ? `<@${o.addedBy}>` : "System/Legacy";
                            const addedAt = o.addedAt ? `<t:${Math.floor(o.addedAt / 1000)}:R>` : "*Date Unknown*";
                            return `### **${tag}**\n> • **ID:** \`${id}\`\n> • **Appointed By:** ${addedBy}\n> • **Promotion:** ${addedAt}`;
                        }))).join("\n\n");

                    components.push(
                        V2.section([
                            "🤝 DELEGATED AUTHORITY: EXTRA OWNERS",
                            V2.text(
                                `### **[ TRUST_CHAIN_MANIFEST ]**\n\n` +
                                `These entities possess **Acting Owner** status, granting them immunity and administrative parity.\n\n` +
                                extraOwnersList
                            )
                        ], message.client.user.displayAvatarURL({ dynamic: true, size: 512 })),
                        "*interX • Layer 2 - Trust Delegation*"
                    );
                    color = "#0099ff";
                }

                components.push();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setLabel("⬅️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIdx === 0),
                    new ButtonBuilder()
                        .setCustomId("page_info")
                        .setLabel(`Layer ${pageIdx + 1} / 3`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("➡️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIdx === 2)
                );
                components.push(row);

                return V2.container(components, color);
            };

            const msg = await message.channel.send({
                content: null,
                components: [await getPanel(currentPage)]
            });

            const collector = msg.createMessageComponentCollector({
                filter: (i) => i.user.id === message.author.id,
                time: 300000
            });

            collector.on("collect", async (i) => {
                if (i.customId === "prev") currentPage--;
                if (i.customId === "next") currentPage++;
                await i.update({
                    components: [await getPanel(currentPage)]
                });
            });

            collector.on("end", async () => {
                msg.edit({ components: [await getPanel(currentPage)] }).catch(() => { });
            });
        } catch (err) {
            console.error(err);
            message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **ERROR:** Failed to load sovereign hierarchy panel.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
