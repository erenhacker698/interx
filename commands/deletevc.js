const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "deletevc",
    description: "Delete a voice channel by mention, name, or ID.",
    usage: "!deletevc [#vc | name | id]",
    aliases: ["dvc", "delvc"],
    permissions: [PermissionsBitField.Flags.ManageChannels],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const botAvatar = message.client.user.displayAvatarURL();

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ components: [V2.container([V2.section(["🚫 ACCESS DENIED", "> ManageChannels permission required."], botAvatar)])] });
        }

        // Fetch fresh channel list
        await message.guild.channels.fetch().catch(() => { });

        let channel = null;

        if (args.length > 0) {
            // 1. Discord mention: <#channelId>
            channel = message.mentions.channels.first() || null;

            // 2. By raw ID
            if (!channel) channel = message.guild.channels.cache.get(args[0]) || null;

            // 3. By name (exact, space or dash)
            if (!channel) {
                const nameQuery = args.join(" ").toLowerCase();
                const dashQuery = args.join("-").toLowerCase();
                channel = message.guild.channels.cache.find(c =>
                    c.type === ChannelType.GuildVoice && (
                        c.name.toLowerCase() === nameQuery ||
                        c.name.toLowerCase() === dashQuery
                    )
                ) || null;
            }

            if (!channel) {
                return message.reply({
                    components: [V2.container([
                        V2.section([
                            "❌ VOICE CHANNEL NOT FOUND",
                            `> No voice channel matched \`${args.join(" ")}\`\n> Use \`#mention\`, exact name, or channel ID.`
                        ], botAvatar)
                    ])]
                });
            }
        } else {
            // No args = use VC the author is in
            channel = message.member.voice.channel;
        }

        if (!channel) {
            return message.reply({ components: [V2.container([V2.section(["⚠️ NO VC FOUND", "> Join a voice channel or provide a name/ID/mention."], botAvatar)])] });
        }

        if (channel.type !== ChannelType.GuildVoice) {
            return message.reply({ components: [V2.container([V2.section(["❌ NOT A VOICE CHANNEL", `> \`${channel.name}\` is not a voice channel.`], botAvatar)])] });
        }

        if (!channel.deletable) {
            return message.reply({ components: [V2.container([V2.section(["❌ CANNOT DELETE", "> Missing permissions or hierarchy issue."], botAvatar)])] });
        }

        const channelName = channel.name;
        try {
            await channel.delete(`Deleted by ${message.author.tag}`);
            return message.channel.send({
                components: [V2.container([
                    V2.section([
                        "🗑️ VOICE CHANNEL DISSOLVED",
                        `**Purged:** \`${channelName}\``
                    ], botAvatar),
                    `> **By:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`
                ])]
            });
        } catch (e) {
            console.error("[deletevc] Error:", e);
            return message.reply({ components: [V2.container([V2.section(["❌ FAILED", "> Could not delete voice channel."], botAvatar)])] });
        }
    }
};
