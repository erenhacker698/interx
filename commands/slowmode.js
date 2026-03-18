const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "slowmode",
    description: "Set channel slowmode",
    usage: "!slowmode <seconds>",
    permissions: [PermissionsBitField.Flags.ManageChannels],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;

        const time = parseInt(args[0]);
        if (isNaN(time)) return message.reply({ components: [V2.container(["⚠️ Please specify a time in seconds. Use `0` to disable."])] });

        try {
            await message.channel.setRateLimitPerUser(time);
            const msg = time === 0
                ? "✅ **Slowmode disabled** for this channel."
                : `⏱️ **Slowmode set to ${time}s** — members must wait between messages.`;
            message.reply({ components: [V2.container([V2.text(msg)])] });
        } catch (e) {
            message.reply({ components: [V2.container(["❌ Error setting slowmode. Check permissions."])] });
        }
    }
};
