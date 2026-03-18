const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "vunmuteall",
    description: "Unmute EVERYONE in your voice channel",
    usage: "!vunmuteall",
    permissions: [PermissionsBitField.Flags.MuteMembers],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        if (!isBotOwner && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            return message.reply("🚫 You don't have permission.");
        }

        const channel = message.member.voice.channel;
        if (!channel) return message.reply("⚠️ You must be in a voice channel.");

        const members = channel.members.filter(m => !m.user.bot && m.voice.serverMute);

        if (members.size === 0) return message.reply("⚠️ No one to unmute.");

        const statusMsg = await message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔊 MASS VOICE UNMUTE").setDescription(`Processing **${members.size}** members in **${channel.name}**...`).setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        // TURBO MASS UNMUTE (PARALLEL)
        const unmuteTasks = members.map(member =>
            member.voice.setMute(false, "Mass Unmute Protocol").catch(() => { })
        );

        await Promise.allSettled(Array.from(unmuteTasks.values()));

        const { AttachmentBuilder } = require("discord.js");
        const unmuteIcon = new AttachmentBuilder("./assets/vunmute.png", { name: "vunmute.png" });

        await statusMsg.edit({
            content: null,
            files: [unmuteIcon],
            components: [V2.container([
                V2.section([
                    "MASS UNMUTE COMPLETE",
                    `**Channel:** ${channel.name}\n**Total Unmuted:** \`${members.size}\` members`
                ], "attachment://vunmute.png"),
                `> **Actioned By:** ${message.author}`,
                "*interX • Sovereign Voice Control*"
            ])]
        });
    }
};
