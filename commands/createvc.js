const { ChannelType, PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "createvc",
    description: "Creates a new voice channel",
    usage: "!createvc <name>",
    aliases: ["mkvc"],
    permissions: [PermissionsBitField.Flags.ManageChannels],

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();
        if (!args[0]) {
            return message.reply({
                components: [V2.container(["⚠️ **Usage:** `!createvc <name>`"])]
            });
        }

        try {
            const name = args.join(" ");
            const vc = await message.guild.channels.create({
                name,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [{ id: message.guild.roles.everyone, allow: [PermissionsBitField.Flags.ViewChannel] }]
            });

            return message.reply({
                components: [V2.container([
                    V2.section([
                        "🔊 VOICE CHANNEL DEPLOYED",
                        `**\`${vc.name}\`** is now live.`
                    ], botAvatar),
                    `> **ID:** \`${vc.id}\`\n> **Created by:** ${message.author}`
                ])]
            });
        } catch (e) {
            console.error(e);
            return message.reply({
                components: [V2.container(["❌ **Error:** Missing Permissions or Hierarchy issue."])]
            });
        }
    }
};
