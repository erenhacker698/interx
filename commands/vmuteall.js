const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "vmuteall",
    description: "Mute EVERYONE in your voice channel (except bots/immune)",
    usage: "!vmuteall",
    permissions: [PermissionsBitField.Flags.MuteMembers],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply("🚫 You don't have permission.");
        }

        const channel = message.member.voice.channel;
        if (!channel) return message.reply("⚠️ You must be in a voice channel.");

        const members = channel.members.filter(m => !m.user.bot && m.id !== BOT_OWNER_ID && m.id !== BOT_DEV_ID && m.id !== message.author.id); // Don't mute self or owner

        if (members.size === 0) return message.reply("⚠️ No one to mute.");

        const statusMsg = await message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔇 MASS VOICE MUTE").setDescription(`Processing **${members.size}** members in **${channel.name}**...`).setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        // TURBO MASS MUTE (PARALLEL)
        const muteTasks = members.map(member =>
            member.voice.setMute(true, "Mass Mute Protocol").catch(() => { })
        );

        await Promise.allSettled(Array.from(muteTasks.values()));

        const { AttachmentBuilder } = require("discord.js");
        const muteIcon = new AttachmentBuilder("./assets/vmute.png", { name: "vmute.png" });

        await statusMsg.edit({
            content: null,
            files: [muteIcon],
            components: [V2.container([
                V2.section([
                    "✅ MASS MUTE COMPLETE",
                    `**Channel:** ${channel.name}\n**Total Muted:** \`${members.size}\` members`
                ], "attachment://vmute.png"), // Premium Blue Mute
                `> **Actioned By:** ${message.author}`,
                "*interX • Sovereign Voice Control*"
            ])]
        });
    }
};
