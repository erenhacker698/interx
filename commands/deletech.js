const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "deletech",
    description: "Delete a text channel by mention, name, or ID.",
    usage: "!deletech [#channel | name | id]",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    aliases: ["removech", "delch", "dc"],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const botAvatar = message.client.user.displayAvatarURL();

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ components: [V2.container([V2.section(["🚫 ACCESS DENIED", "> ManageChannels permission required."], botAvatar)])] });
        }

        // Fetch fresh channel list
        await message.guild.channels.fetch().catch(() => { });

        let target = null;

        if (args.length > 0) {
            // 1. Discord mention: <#channelId>
            target = message.mentions.channels.first() || null;

            // 2. By raw ID
            if (!target) target = message.guild.channels.cache.get(args[0]) || null;

            // 3. By name (exact, space-joined or dash-joined)
            if (!target) {
                const nameQuery = args.join(" ").toLowerCase();
                const dashQuery = args.join("-").toLowerCase();
                target = message.guild.channels.cache.find(c =>
                    c.type === ChannelType.GuildText && (
                        c.name.toLowerCase() === nameQuery ||
                        c.name.toLowerCase() === dashQuery
                    )
                ) || null;
            }

            if (!target) {
                return message.reply({
                    components: [V2.container([
                        V2.section([
                            "❌ CHANNEL NOT FOUND",
                            `> No text channel matched \`${args.join(" ")}\`\n> Use \`#mention\`, exact name, or channel ID.`
                        ], botAvatar)
                    ])]
                });
            }
        } else {
            // No args = target current channel
            target = message.channel;
        }

        if (!target.deletable) {
            return message.reply({ components: [V2.container([V2.section(["❌ CANNOT DELETE", "> I'm missing permissions or this is a system channel."], botAvatar)])] });
        }

        const isCurrent = target.id === message.channel.id;
        const name = target.name;

        try {
            if (isCurrent) {
                await message.channel.send({
                    components: [V2.container([
                        V2.section([
                            "🗑️ SELF-DESTRUCT INITIATED",
                            `> **Channel:** \`${name}\` is being deleted...\n> **By:** ${message.author}`
                        ], botAvatar)
                    ])]
                });
                await new Promise(r => setTimeout(r, 800));
                await target.delete(`Deleted by ${message.author.tag}`);
            } else {
                await target.delete(`Deleted by ${message.author.tag}`);
                return message.reply({
                    components: [V2.container([
                        V2.section([
                            "🗑️ CHANNEL DISSOLVED",
                            `**Purged:** \`${name}\``
                        ], botAvatar),
                        `> **By:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`
                    ])]
                });
            }
        } catch (err) {
            console.error("[deletech] Error:", err);
            return message.channel?.send({ components: [V2.container([V2.section(["❌ Failed to delete channel. Check my permissions."], botAvatar)])] })?.catch(() => { });
        }
    }
};
