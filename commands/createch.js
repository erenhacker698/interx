const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "createch",
    description: "Create a new text or voice channel.",
    usage: "!createch <name> [text/voice]",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    aliases: ["createchannel", "cc"],

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();
        if (!args[0]) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("⚠️ MISSING ARGUMENTS").setDescription("> Usage: `!createch <name> [text/voice]`").setFooter({ text: "interX • Security" }).setTimestamp()]
            });
        }

        const name = args[0];
        const typeArg = args[1]?.toLowerCase() || "text";
        const type = (typeArg === "voice" || typeArg === "vc") ? ChannelType.GuildVoice : ChannelType.GuildText;
        const typeLabel = type === ChannelType.GuildVoice ? "🔊 Voice Channel" : "💬 Text Channel";

        try {
            const channel = await message.guild.channels.create({
                name,
                type,
                reason: `Created by ${message.author.tag}`
            });

            return message.reply({
                components: [V2.container([
                    V2.section([
                        "✅ CHANNEL DEPLOYED",
                        `**${typeLabel}** \`${channel.name}\` is now live.`
                    ], botAvatar),
                    `> **Type:** ${typeLabel}\n> **ID:** \`${channel.id}\`\n> **Created by:** ${message.author}` ])]
            });
        } catch (err) {
            console.error(err);
            return message.reply({
                components: [V2.container(["❌ **Failed to create channel.** Check my permissions."])]
            });
        }
    }
};
