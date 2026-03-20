const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: "invite-lb",
    description: "Display the server's top inviters.",
    aliases: ["invlb", "invites-lb", "invitesleaderboard"],
    usage: "!invite-lb",

    async execute(message) {
        const guildId = message.guild.id;

        // Fetch all invite keys for this guild
        // Pattern: invites_GUILDID_USERID
        const allKeys = await db.all();
        const guildInvites = allKeys.filter(entry => entry.id.startsWith(`invites_${guildId}_`));

        if (guildInvites.length === 0) {
            return message.reply({ content: "❌ **No invite data recorded in this server yet.**" });
        }

        const leaderboard = guildInvites.map(entry => {
            const data = entry.value;
            const userId = entry.id.split("_")[2];
            const regular = data.regular || 0;
            const bonus = data.bonus || 0;
            const leaves = data.leaves || 0;
            const fake = data.fake || 0;
            const total = (regular + bonus) - (leaves + fake);
            return { userId, total, regular, bonus, leaves, fake };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setAuthor({
                name: "interX INVITE LEADERBOARD",
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(
                `### 🛡️ TOP 10 INVITERS\n\n` +
                leaderboard.map((u, i) => {
                    const tag = message.guild.members.cache.get(u.userId)?.user?.tag || `User#${u.userId.slice(-4)}`;
                    return `**${i + 1}.** **${tag}** — \`${u.total}\` total\n> (\`${u.regular}\` reg, \`${u.bonus}\` bonus, \`${u.leaves}\` leaves, \`${u.fake}\` fake)`;
                }).join("\n\n")
            )
            .setFooter({
                text: `interX Security • Page 1/1 • ${guildInvites.length} recorded`,
                iconURL: message.client.user.displayAvatarURL()
            })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
