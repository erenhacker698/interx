const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
module.exports = {
    name: "warnings",
    description: "View or clear warnings for a user",
    usage: "!warnings @user [clear]",
    aliases: ["warns"],
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    execute(message, args) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!target) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ MISSING TARGET").setDescription("Usage: `!warnings @user [clear]`").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        const DB_PATH = path.join(__dirname, "../data/warnings.json");
        let db = {};
        if (fs.existsSync(DB_PATH)) {
            try { db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }

        const userWarnings = db[message.guild.id]?.[target.id] || [];

        // CLEAR WARNINGS
        if (args[1] && args[1].toLowerCase() === "clear") {
            if (db[message.guild.id]) {
                delete db[message.guild.id][target.id];
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
            }

            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("✅ RECORD CLEARED").setDescription(`**All warnings for ${target.user.tag} have been expunged.**`).setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        // VIEW WARNINGS
        if (userWarnings.length === 0) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("✅ CLEAN RECORD").setDescription(`User **${target.user.tag}** has no recorded infractions.`).setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        const history = userWarnings.map((w, i) => {
            const date = new Date(w.timestamp).toLocaleDateString();
            const moderator = message.guild.members.cache.get(w.moderator)?.user.tag || "Unknown";
            return `**${i + 1}.** \`${date}\` • **Mod:** ${moderator}\n> **Reason:** ${w.reason}`;
        }).join("\n\n");

        const container = V2.container([
            V2.section(
                [
                    "📜 INFRACTION HISTORY",
                    `**Subject:** ${target.user.tag}\n**Total Warnings:** ${userWarnings.length}`
                ],
                target.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
            ),
            V2.text(history.length > 2000 ? history.substring(0, 2000) + "... (truncated)" : history),
            `*interX Justice System*`
        ]);

        message.channel.send({
            content: null,
            components: [container]
        });
    }
};
