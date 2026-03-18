const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

function parseDuration(input) {
    const match = input?.match(/^(\d+)\s*(s|m|h|d)?$/i);
    if (!match) return null;
    const v = parseInt(match[1]);
    const u = (match[2] || "m").toLowerCase();
    return v * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[u];
}

function formatDuration(ms) {
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000),
        m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(" ") || "0s";
}

module.exports = {
    name: "mute",
    description: "Timeout (mute) a user for a specified duration",
    usage: "!mute @user [duration] [reason]",
    aliases: ["tempmute"],
    permissions: [PermissionsBitField.Flags.ModerateMembers],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("🚫 **Access Denied.** You need `Moderate Members` permission.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔇 MUTE — USAGE").setDescription("> `!mute @user [duration] [reason]`\n> **Duration:** `10s` `5m` `2h` `1d`\n> *Default: 1h if no duration given*").setFooter({ text: "interX • Moderation" }).setTimestamp()] });
        }

        if ((target.id === BOT_OWNER_ID) || target.id === message.guild.ownerId) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle("⚠️ PATHETIC ATTEMPT DETECTED").setDescription(`Did you seriously just try to mute ${(target.id === BOT_OWNER_ID) ? "a **System Architect**" : "the **Server Owner**"}?\n\n> You have no power here, ${message.author}. Stand down.`).setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 512 })).setFooter({ text: "interX • Sovereign Protection" }).setTimestamp()] });
        }

        if (!isBotOwner && !isServerOwner && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ Cannot mute a user with an **equal or higher role** than yours.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (target.roles.highest.position >= message.guild.members.me.roles.highest.position) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ **Hierarchy Error:** I cannot mute this user — they outrank me.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const durationInput = args[1] || "1h";
        const durationMs = parseDuration(durationInput);
        if (!durationMs) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ **Invalid duration.** Use formats like `10m`, `2h`, `1d`.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
        if (durationMs > 28 * 86400000) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ **Maximum timeout duration is 28 days.**").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const reason = args.slice(2).join(" ") || "No reason provided";
        const durationFmt = formatDuration(durationMs);
        const expiresAt = Math.floor((Date.now() + durationMs) / 1000);

        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("mute_yes").setLabel("🔇  Confirm Mute").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("mute_no").setLabel("Cancel").setStyle(ButtonStyle.Secondary)
        );

        const confirmEmbed = new EmbedBuilder()
            .setColor(0xFF0033)
            .setTitle("🔇 TEMPORARY SILENCE")
            .setDescription(`Mute **${target.user.tag}** for \`${durationFmt}\`?\n\n> **Reason:** ${reason}`)
            .setThumbnail(target.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
            .setFooter({ text: "interX • Confirmation Required" })
            .setTimestamp();

        const confirmMsg = await message.reply({ embeds: [confirmEmbed], components: [confirmRow] });

        const collector = confirmMsg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 20000,
            max: 1
        });

        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate();

            if (interaction.customId === "mute_no") {
                return confirmMsg.delete().catch(() => { });
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0033)
                    .setTitle("🔇 YOU HAVE BEEN MUTED")
                    .setDescription(`You were muted in **${message.guild.name}**.`)
                    .setThumbnail(message.client.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                    .addFields(
                        { name: "⏱️ Duration", value: durationFmt, inline: true },
                        { name: "📝 Reason", value: reason, inline: true },
                        { name: "👮 Moderator", value: message.author.tag, inline: true },
                        { name: "🔓 Expires", value: `<t:${expiresAt}:R>`, inline: true }
                    )
                    .setFooter({ text: "interX • Moderation System" })
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] }).catch(() => { });
                await target.timeout(durationMs, reason);

                const verdictEmbed = new EmbedBuilder()
                    .setColor(0xFF0033)
                    .setTitle("🔇 MUTE ACTIVE")
                    .setDescription(`**${target.user.tag}** has been silenced.`)
                    .setThumbnail(target.user.displayAvatarURL({ forceStatic: true, extension: "png" }))
                    .addFields(
                        { name: "⏱️ Duration", value: `\`${durationFmt}\``, inline: true },
                        { name: "📝 Reason", value: reason, inline: true },
                        { name: "👮 Enforcer", value: `${message.author}`, inline: true },
                        { name: "🔓 Expires", value: `<t:${expiresAt}:R>`, inline: true }
                    )
                    .setFooter({ text: "interX • Moderation System" })
                    .setTimestamp();

                await message.channel.send({ embeds: [verdictEmbed] });

            } catch (err) {
                console.error(err);
                await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF0033).setDescription("❌ **Execution Failed:** Check bot permissions and role hierarchy.").setFooter({ text: "interX • Error" }).setTimestamp()] });
            }

            confirmMsg.delete().catch(() => { });
        });

        collector.on("end", (_, reason) => {
            if (reason === "time") confirmMsg.delete().catch(() => { });
        });
    }
};
