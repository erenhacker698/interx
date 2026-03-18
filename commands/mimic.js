const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const axios = require("axios");

const cooldowns = new Map();

module.exports = {
    name: "mimic",
    description: "Bot adopts the server's identity — name, avatar & banner (Bot Owner only)",
    aliases: ["servermimic", "mimicserver"],
    usage: "!mimic | !mimic off",

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) {
            return message.reply({
                components: [V2.container(["🚫 **Bot Owner Only.** This command is restricted."])]
            });
        }

        const guild = message.guild;
        const rest = new REST({ version: "10" }).setToken(process.env.TOKEN || message.client.token);

        // ── OFF / RESET ──
        if (args[0]?.toLowerCase() === "off") {
            try {
                await rest.patch(Routes.guildMember(guild.id, "@me"), {
                    body: { nick: null, avatar: null, banner: null }
                });
                return message.reply({
                    embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔄 MIMIC DEACTIVATED").setDescription("Bot identity restored to default.\n> Nickname, Avatar & Banner cleared for this server.").setFooter({ text: "interX • Security" }).setTimestamp()]
                });
            } catch (e) {
                return message.reply({
                    components: [V2.container([`❌ Failed to reset: ${e.message}`])]
                });
            }
        }

        // ── COOLDOWN CHECK ──
        const now = Date.now();
        const CD = 3 * 60 * 1000;
        if (cooldowns.has(guild.id)) {
            const left = ((cooldowns.get(guild.id) + CD - now) / 1000 / 60).toFixed(1);
            if (now < cooldowns.get(guild.id) + CD) {
                return message.reply({
                    components: [V2.container([
                        "⏳ RATE LIMIT ACTIVE",
                        `Discord restricts identity changes. Wait **${left} min**.\nUse \`!mimic off\` to reset identity.`
                    ])]
                });
            }
        }

        const statusMsg = await message.reply({
            components: [V2.container([`🎭 **Adopting server identity of **${guild.name}**...**`])]
        });

        const results = [];
        let body = {};

        // ── 1. NICKNAME → Server Name ──
        body.nick = guild.name.substring(0, 32); // Discord nickname limit
        results.push(`> 🏷️ **Nickname:** \`${body.nick}\``);

        // ── 2. AVATAR → Server Icon ──
        const iconUrl = guild.iconURL({ extension: "png", size: 1024, forceStatic: true });
        if (iconUrl) {
            try {
                const imgRes = await axios.get(iconUrl, { responseType: "arraybuffer" });
                const iconBase64 = `data:image/png;base64,${Buffer.from(imgRes.data, "binary").toString("base64")}`;
                body.avatar = iconBase64;
                results.push(`> 🖼️ **Avatar:** Server Icon applied`);
            } catch (e) {
                results.push(`> 🖼️ **Avatar:** ❌ Failed — ${e.message}`);
            }
        } else {
            results.push(`> 🖼️ **Avatar:** ⚠️ Server has no icon`);
        }

        // ── 3. BANNER → Server Banner ──
        const bannerUrl = guild.bannerURL({ extension: "png", size: 1024, forceStatic: true });
        if (bannerUrl) {
            try {
                const banRes = await axios.get(bannerUrl, { responseType: "arraybuffer" });
                const bannerBase64 = `data:image/png;base64,${Buffer.from(banRes.data, "binary").toString("base64")}`;
                body.banner = bannerBase64;
                results.push(`> 🏳️ **Banner:** Server Banner applied`);
            } catch (e) {
                results.push(`> 🏳️ **Banner:** ❌ Failed — ${e.message}`);
            }
        } else {
            results.push(`> 🏳️ **Banner:** ⚠️ Server has no banner`);
        }

        // ── APPLY ALL VIA REST AT ONCE ──
        try {
            await rest.patch(Routes.guildMember(guild.id, "@me"), { body });
            cooldowns.set(guild.id, now);

            await statusMsg.edit({
                components: [V2.container([
                    V2.section([
                        "🎭 SERVER IDENTITY ADOPTED",
                        V2.text(
                            `Bot is now mimicking **${guild.name}** in this server.\n\n` +
                            `${results.join("\n")}\n\n` +
                            `> *Use \`!mimic off\` to restore default identity.*`
                        )
                    ], iconUrl || message.client.user.displayAvatarURL()),
                    "*interX • Identity Protocol*"
                ])]
            });

        } catch (err) {
            console.error("[Mimic]", err);
            let errMsg = err.message || "Unknown error";
            if (err.code === 50013) errMsg = "Missing permissions to change bot identity in this server.";
            if (err.code === 50035) errMsg = "Image too large or invalid format.";

            await statusMsg.edit({
                components: [V2.container([`❌ **Identity adoption failed:** ${errMsg}`])]
            });
        }
    }
};
