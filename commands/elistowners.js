const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "elistowners",
    description: "Global Sovereign Hierarchy Manifest",
    aliases: ["globalowners", "eloall"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⛔ **ACCESS DENIED:** The Global manifest is restricted to the Lead Architect.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        try {
            const OWNERS_DB = path.join(__dirname, "../data/owners.json");
            if (!fs.existsSync(OWNERS_DB)) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("📂 **SYSTEM:** No global extra owner records exist.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            }

            const db = JSON.parse(fs.readFileSync(OWNERS_DB, "utf8"));
            const entries = Object.entries(db);

            if (entries.length === 0) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("📂 **SYSTEM:** No global extra owner records exist.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            }

            const pages = [];
            const itemsPerPage = 3;

            const flatList = [];
            for (const [guildId, owners] of entries) {
                const guild = message.client.guilds.cache.get(guildId) || await message.client.guilds.fetch(guildId).catch(() => null);
                const guildName = guild ? guild.name : `Unknown Guild (${guildId})`;

                owners.forEach(o => {
                    flatList.push({
                        guildId,
                        guildName,
                        ownerId: typeof o === 'string' ? o : o.id,
                        addedBy: o.addedBy,
                        addedAt: o.addedAt
                    });
                });
            }

            if (flatList.length === 0) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("📂 **SYSTEM:** Global manifest is currently empty.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            }

            for (let i = 0; i < flatList.length; i += itemsPerPage) {
                const chunk = flatList.slice(i, i + itemsPerPage);
                const listStr = (await Promise.all(chunk.map(async item => {
                    const user = message.client.users.cache.get(item.ownerId) || await message.client.users.fetch(item.ownerId).catch(() => null);
                    const tag = user ? user.tag : "Unknown Entity";
                    return `### **${tag}**\n` +
                        `> • **Guild:** \`${item.guildName}\` (\`${item.guildId}\`)\n` +
                        `> • **ID:** \`${item.ownerId}\`\n` +
                        `> • **Promotion:** ${item.addedAt ? `<t:${Math.floor(item.addedAt / 1000)}:R>` : "*Date Unknown*"}`;
                }))).join("\n\n");

                pages.push(V2.container([
                    V2.section([
                        "🌐 GLOBAL SOVEREIGN MANIFEST",
                        V2.text(
                            `### **[ ARCHITECT_LEVEL_MANIFEST ]**\n\n` +
                            `Displaying all entities currently holding delegated sovereign authority across the network.\n\n` +
                            listStr
                        )
                    ], message.client.user.displayAvatarURL({ size: 512 })),
                    `*interX • Global Registry • Layer X*`
                ], "#000000"));
            }

            let currentPage = 0;
            const getComponents = (pageIdx) => {
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setLabel("⬅️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIdx === 0),
                    new ButtonBuilder()
                        .setCustomId("page_info")
                        .setLabel(`Page ${pageIdx + 1} / ${pages.length}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("➡️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(pageIdx === pages.length - 1)
                );
                //pages[pageIdx] is the Container component. We must wrap it in an array along with the ActionRow button row.
                return [pages[pageIdx], row];
            };

            const msg = await message.channel.send({
                content: null,
                components: getComponents(currentPage)
            });

            const collector = msg.createMessageComponentCollector({
                filter: (i) => i.user.id === message.author.id,
                time: 300000
            });

            collector.on("collect", async (i) => {
                if (i.customId === "prev") currentPage--;
                if (i.customId === "next") currentPage++;
                await i.update({ components: getComponents(currentPage) });
            });

            collector.on("end", () => {
                msg.edit({ components: getComponents(currentPage) }).catch(() => { });
            });

        } catch (err) {
            console.error(err);
            message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **ERROR:** Failed to access records.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
