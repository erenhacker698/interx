const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const djsVersion = require("discord.js").version;

module.exports = {
    name: "debugavatar",
    description: "Debug Server Avatar Issues",
    usage: "!debugavatar",

    async execute(message) {
        if (message.author.id !== message.guild.ownerId && (message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID))
            return message.reply({ components: [V2.container(["🚫 Only the server owner or bot owner can use this."])] });

        const guild = message.guild;
        const botMember = guild.members.me;
        const logs = [
            `discord.js Version: ${djsVersion}`,
            `Bot: ${botMember?.user?.tag} (${botMember?.id})`,
            `Permissions: ${botMember?.permissions.toArray().slice(0, 5).join(", ")}...`,
            `botMember.edit exists? ${typeof botMember.edit === "function"}` ];

        const serverIconUrl = guild.iconURL({ extension: "png", size: 1024 });
        logs.push(`Server Icon URL: ${serverIconUrl || "None"}`);

        if (!serverIconUrl) {
            logs.push("No server icon to test.");
        } else {
            logs.push("Attempting fetch + botMember.edit({ avatar: buffer })...");
            try {
                const response = await fetch(serverIconUrl);
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                const buffer = Buffer.from(await response.arrayBuffer());
                const result = await guild.members.editMe({ avatar: buffer });
                logs.push(`✅ Success! New Avatar Hash: ${result.avatar}`);
            } catch (err) {
                logs.push(`❌ ERROR: ${err.message}`);
                if (err.code) logs.push(`Code: ${err.code}`);
            }
        }

        return message.reply({
            components: [V2.container([
                "🔍 AVATAR DEBUG REPORT",
                `\`\`\`\n${logs.join("\n")}\n\`\`\``,
                "*interX • Diagnostic Protocol*"
            ])]
        });
    }
};
