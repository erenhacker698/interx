const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "renamech",
    description: "Rename a text channel by mention, ID, or name. Defaults to current channel.",
    usage: "!renamech [#channel | ID | name] <new_name>",
    permissions: [PermissionsBitField.Flags.ManageChannels],
    aliases: ["rch"],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;
        const botAvatar = message.client.user.displayAvatarURL();

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ components: [V2.container([V2.section(["🚫 ACCESS DENIED", "> ManageChannels permission required."], botAvatar)])] });
        }

        if (args.length < 1) {
            return message.reply({
                components: [V2.container([V2.section(["⚠️ MISSING NAME", "> **Usage:** `!renamech [#channel] <new_name>`"], botAvatar)])]
            });
        }

        // Fresh fetch
        await message.guild.channels.fetch().catch(() => { });

        let target = null;
        let newName = "";

        // Attempt to find a target channel in args[0]
        const firstArg = args[0];
        const isMention = message.mentions.channels.first();
        const isID = message.guild.channels.cache.get(firstArg);
        const isNameMatch = message.guild.channels.cache.find(c => c.type === ChannelType.GuildText && (c.name.toLowerCase() === firstArg.replace('#', '').toLowerCase() || c.name.toLowerCase() === firstArg.toLowerCase()));

        if (isMention || isID || (isNameMatch && args.length > 1)) {
            target = isMention || isID || isNameMatch;
            newName = args.slice(1).join("-").toLowerCase();
        } else {
            // Default to current channel
            target = message.channel;
            newName = args.join("-").toLowerCase();
        }

        if (!target || target.type !== ChannelType.GuildText) {
            return message.reply({
                components: [V2.container([V2.section(["❌ INVALID CHANNEL", "> Target must be a text channel."], botAvatar)])]
            });
        }

        // Sanitization
        newName = newName.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        if (!newName) {
            return message.reply({
                components: [V2.container([V2.section(["⚠️ NAME REQUIRED", "> Please provide a valid alphanumeric name."], botAvatar)])]
            });
        }

        const oldName = target.name;

        try {
            await target.setName(newName);
            return message.channel.send({
                components: [V2.container([
                    V2.section([
                        "🏷️ CHANNEL RENAMED",
                        `**Path:** ${target}\n**Log:** \`${oldName}\` ➡️ \`${newName}\``
                    ], botAvatar),
                    `> **Action by:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`
                ])]
            });
        } catch (err) {
            console.error(err);
            return message.reply({
                components: [V2.container([V2.section(["❌ RENAME FAILED", "> Check my permissions or rate limits (only 2 renames per 10 mins)."], botAvatar)])]
            });
        }
    }
};
