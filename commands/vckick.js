const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "vckick",
    description: "Kick a member from a voice channel.",
    usage: "!vckick <@user | userId>",
    aliases: ["vkick", "kickvc", "dkick"],
    permissions: [PermissionsBitField.Flags.MoveMembers],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const botAvatar = message.client.user.displayAvatarURL();

        // Permission check
        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return message.reply({
                components: [V2.container([
                    V2.section(["🚫 ACCESS DENIED", "> MoveMembers permission required."], botAvatar)
                ])]
            });
        }

        // Resolve target member
        let target = message.mentions.members.first();
        if (!target && args[0]) {
            target = message.guild.members.cache.get(args[0]) ||
                await message.guild.members.fetch(args[0]).catch(() => null);
        }

        if (!target) {
            return message.reply({
                components: [V2.container([
                    V2.section([
                        "⚠️ MISSING TARGET",
                        "> **Usage:** `!vckick <@user | userId>`"
                    ], botAvatar)
                ])]
            });
        }

        // Check target is in a VC
        if (!target.voice.channel) {
            return message.reply({
                components: [V2.container([
                    V2.section([
                        "⚠️ NOT IN A VC",
                        `> **${target.user.username}** is not in any voice channel.`
                    ], botAvatar)
                ])]
            });
        }

        // Cannot kick bot owner
        if ((target.id === BOT_OWNER_ID)) {
            return message.reply({
                components: [V2.container([
                    V2.section(["🛡️ PROTECTED", "> You cannot kick the Bot Owner from a VC."], botAvatar)
                ])]
            });
        }

        const vcName = target.voice.channel.name;
        try {
            // Disconnect = set voice channel to null
            await target.voice.disconnect(`VC Kicked by ${message.author.tag}`);
            return message.reply({
                components: [V2.container([
                    V2.section([
                        "🚪 EJECTED FROM VC",
                        `**User:** ${target.user}\n**From:** \`${vcName}\``
                    ], botAvatar),
                    `> **By:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`
                ])]
            });
        } catch (err) {
            console.error("[vckick] Error:", err);
            return message.reply({
                components: [V2.container([
                    V2.section(["❌ FAILED", `> Could not kick **${target.user.username}**. Check my MoveMembers permission.`], botAvatar)
                ])]
            });
        }
    }
};
