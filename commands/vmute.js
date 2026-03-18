const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID, ERROR_COLOR, SUCCESS_COLOR } = require("../config");

module.exports = {
    name: "vmute",
    description: "Server mute a member in Voice Channel",
    usage: "!vmute @user [reason]",
    permissions: [PermissionsBitField.Flags.MuteMembers],

    async execute(message, args) {
        // Owner Bypass & Perms
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **Security Alert:** Access Denied. Mute permissions required.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!target) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Invalid Target:** Specify a valid user to voice-mute.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        if (!target.voice.channel) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **Action Failed:** The target is currently not in a voice channel.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        // Immunity 
        if ((target.id === BOT_OWNER_ID)) {
            return message.reply({
                content: null, components: [
                    V2.container([
                        V2.section(
                            [
                                "⚠️ PATHETIC ATTEMPT DETECTED",
                                "Did you seriously just try to voice-mute a **System Architect**?"
                            ],
                            target.user.displayAvatarURL({ dynamic: true, size: 512 })
                        ),
                        `> You have no power here, ${message.author}. Know your place.`,
                        "*interX • Sovereign Protection*"
                    ], "#FF0000") // Brutal Red
                ]
            });
        }

        try {
            const reason = args.slice(1).join(" ") || "No reason provided.";
            await target.voice.setMute(true, reason);

            const container = V2.container([
                V2.section([
                    "🔇 SECURE MUTE ENFORCED",
                    `**Target:** ${target}\n**Channel:** ${target.voice.channel.name}\n**Status:** \`VOICE MUTED\``
                ], target.user.displayAvatarURL({ dynamic: true, size: 512 })),
                "📋 INCIDENT LOG",
                `> **Reason:** \`${reason}\`\n> **Enforcer:** ${message.author}`,
                "*interX • Voice Security protocol*"
            ]);

            message.reply({ content: null, components: [container] });

        } catch (e) {
            message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("See details below.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
