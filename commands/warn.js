const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "warn",
    description: "Issue a formal reprimand using the V2 interface",
    usage: "!warn @user [reason]",
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args) {
        const fs = require("fs");
        const path = require("path");
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) return message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ MISSING TARGET").setDescription("Usage: `!warn @user [reason]`").setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        if ((target.id === BOT_OWNER_ID) || target.id === message.guild.ownerId) {
            return message.reply({
                content: null,
                components: [
                    V2.container([
                        V2.section(
                            [
                                "⚠️ PATHETIC ATTEMPT DETECTED",
                                `Did you seriously just try to warn ${(target.id === BOT_OWNER_ID) ? "a **System Architect**" : "the **Server Owner**"}?`
                            ],
                            target.user.displayAvatarURL({ dynamic: true, size: 512 })
                        ),
                        `> You have no power here, ${message.author}. Know your place.`,
                        "*interX • Sovereign Protection*"
                    ], "#FF0000")
                ]
            });
        }

        if (!isBotOwner && !isServerOwner && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({
                content: null,
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🚫 HIERARCHY ERROR").setDescription("You cannot warn a superior/equal.").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        const reason = args.slice(1).join(" ") || "No reason provided.";
        const DB_PATH = path.join(__dirname, "../data/warnings.json");

        // LOAD DB
        let db = {};
        if (fs.existsSync(DB_PATH)) {
            try { db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }
        if (!db[message.guild.id]) db[message.guild.id] = {};
        if (!db[message.guild.id][target.id]) db[message.guild.id][target.id] = [];

        // ADD WARNING
        const warning = {
            id: Date.now().toString(36),
            reason: reason,
            moderator: message.author.id,
            timestamp: Date.now()
        };
        db[message.guild.id][target.id].push(warning);
        const count = db[message.guild.id][target.id].length;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

        // V2 WARNING CONTAINER
        const warnContainer = new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ OFFICIAL REPRIMAND").setDescription(`**Subject:** ${target.user.tag}\n**Moderator:** ${message.author}\n**Status:** Recorded (Warn #${count})`).addFields({ name: "📜 CITATION DETAILS", value: `> **Reason:** ${reason}\n> **Domain:** ${message.guild.name}` }).addFields({ name: "\u200b", value: `*interX Justice System*` }).setFooter({ text: "interX • Security" }).setTimestamp();

        // DM THE USER
        try {
            const warnNotice = V2.container([
                V2.section(
                    [
                        "⚠️ OFFICIAL REPRIMAND",
                        `You have received a formal warning in **${message.guild.name}**.`
                    ],
                    message.client.user.displayAvatarURL({ forceStatic: true, extension: 'png' })
                ),
                "📝 CITATION DETAILS",
                `> ${reason}`,
                `**Moderator:** ${message.author.tag}\n**Total Warnings:** ${count}\n\n*Accumulating warnings will result in automatic expulsion.*`
            ]);
            await target.send({ content: null, components: [warnNotice] }).catch(() => { });
        } catch (e) { }

        await message.channel.send({ content: null, components: [warnContainer] });

        // AUTO-PUNISHMENT
        if (count >= 5) {
            if (target.bannable) {
                await target.ban({ reason: "Auto-Ban: Accumulated 5 Warnings" });
                const banEmbed = new EmbedBuilder().setColor(0xFF0033).setTitle("⛔ AUTOMATIC BAN").setDescription(`**Threshold Reached (5 Warnings)**\nUser **${target.user.tag}** has been permanently banned.`).setFooter({ text: "interX • Security" }).setTimestamp();
                message.channel.send({ content: null, components: [banEmbed] });
                // Reset warns? Usually we keep them for record, or archive. Let's keep them.
            }
        } else if (count >= 3) {
            if (target.kickable) {
                await target.kick("Auto-Kick: Accumulated 3 Warnings");
                const kickEmbed = new EmbedBuilder().setColor(0xFF0033).setTitle("👢 AUTOMATIC KICK").setDescription(`**Threshold Reached (3 Warnings)**\nUser **${target.user.tag}** has been kicked.`).setFooter({ text: "interX • Security" }).setTimestamp();
                message.channel.send({ content: null, components: [kickEmbed] });
            }
        }
    }
};
