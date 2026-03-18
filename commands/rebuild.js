const { PermissionsBitField, ChannelType, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "rebuild",
    description: "Hyper-speed mass channel creation",
    usage: "!rebuild <name> <count>",
    aliases: ["rb", "masscreate"],
    permissions: [PermissionsBitField.Flags.Administrator],
    whitelistOnly: true,

    async execute(message, args) {
        const isOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID)) || message.guild.ownerId === message.author.id;
        if (!isOwner) return;

        const channelName = args[0];
        const count = parseInt(args[1]);

        if (!channelName || isNaN(count)) {
            return message.reply({
                components: [V2.container([
                    "🏗️ REBUILD PROTOCOL",
                    "Provide parameters for the reconstruction wave.\n\n**Format:** `!rebuild <name> <count>`\n*Example: `!rebuild nizz-wizz 50`*",
                    "*Max recommended: 50 per wave for API stability.*"
                ])]
            });
        }

        if (count > 100) return message.reply({ components: [V2.container(["⚠️ **Safety Limit:** Maximum **100 channels** per wave."])] });

        const statusMsg = await message.channel.send({
            components: [V2.container([`🚀 **Initializing Reconstruction Wave...**\nCreating \`${count}\` channels named \`${channelName}\`.`])]
        });

        try {
            const startTime = Date.now();
            await Promise.all(
                Array.from({ length: count }, () =>
                    message.guild.channels.create({ name: channelName, type: ChannelType.GuildText, reason: "Turbo Rebuild" }).catch(() => { })
                )
            );
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            await statusMsg.edit({
                components: [V2.container([
                    "✅ RECONSTRUCTION COMPLETE",
                    `Successfully deployed \`${count}\` sectors.\n\n> 🏷️ **Name:** \`${channelName}\`\n> ⚡ **Time:** \`${duration}s\``
                ])]
            });
        } catch (err) {
            statusMsg.edit({ components: [V2.container(["❌ **Critical Failure** during reconstruction wave."])] });
        }
    }
};
