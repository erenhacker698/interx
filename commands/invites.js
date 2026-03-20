const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: "invites",
    description: "Check a user's invite statistics.",
    aliases: ["inv"],
    usage: "!invites [user]",

    async execute(message, args) {
        const target = message.mentions.users.first() || (args[0] ? await message.client.users.fetch(args[0]).catch(() => message.author) : message.author);
        const guildId = message.guild.id;
        const userId = target.id;

        // Fetch data
        const regular = await db.get(`invites_${guildId}_${userId}.regular`) || 0;
        const bonus = await db.get(`invites_${guildId}_${userId}.bonus`) || 0;
        const leaves = await db.get(`invites_${guildId}_${userId}.leaves`) || 0;
        const fake = await db.get(`invites_${guildId}_${userId}.fake`) || 0;
        const total = (regular + bonus) - (leaves + fake);

        const embed = new EmbedBuilder()
            .setColor("#df0000")
            .setAuthor({
                name: `${target.tag}'s Invites`,
                iconURL: target.displayAvatarURL({ dynamic: true })
            })
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .setDescription(
                `### 🛡️ INVITE STATISTICS\n` +
                `> **User:** ${target} (\`${userId}\`)\n` +
                `> **Current Invites:** \`${total < 0 ? 0 : total}\` total\n\n` +
                `**BREAKDOWN**\n` +
                `\`\`\`ansi\n` +
                `\u001b[2;31m[+]\u001b[0m Regular: \`${regular}\`\n` +
                `\u001b[2;34m[*]\u001b[0m Bonus:   \`${bonus}\`\n` +
                `\u001b[2;33m[-]\u001b[0m Leaves:  \`${leaves}\`\n` +
                `\u001b[2;30m[!]\u001b[0m Fake:    \`${fake}\` \n` +
                `\`\`\``
            )
            .setFooter({
                text: `interX Security • ${message.guild.name}`,
                iconURL: message.client.user.displayAvatarURL()
            })
            .setTimestamp();

        // Admin-only: add/remove bonus invites
        if (message.member.permissions.has(PermissionsBitField.Flags.Administrator) && args[1]) {
            const action = args[1].toLowerCase();
            const amount = parseInt(args[2]);

            if (action === "add" && !isNaN(amount)) {
                await db.add(`invites_${guildId}_${userId}.bonus`, amount);
                return message.reply({ content: `✅ Added **${amount}** bonus invites to ${target.tag}.` });
            } else if (action === "remove" && !isNaN(amount)) {
                await db.sub(`invites_${guildId}_${userId}.bonus`, amount);
                return message.reply({ content: `✅ Removed **${amount}** bonus invites from ${target.tag}.` });
            } else if (action === "reset") {
                await db.set(`invites_${guildId}_${userId}`, { regular: 0, bonus: 0, leaves: 0, fake: 0 });
                return message.reply({ content: `✅ Reset invite data for ${target.tag}.` });
            }
        }

        return message.reply({ embeds: [embed] });
    }
};
