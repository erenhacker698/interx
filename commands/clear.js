const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "clear",
    description: "Bulk delete messages",
    aliases: ["purge"],
    usage: "!clear <amount>",
    permissions: [PermissionsBitField.Flags.ManageMessages],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100)
            return message.reply({ components: [V2.container(["⚠️ Amount must be between **1** and **100**."])] });

        try {
            await message.channel.bulkDelete(amount, true);
            const msg = await message.channel.send({ components: [V2.container([`🧹 Cleared **${amount}** messages.`])] });
            setTimeout(() => msg.delete().catch(() => { }), 3000);
        } catch (e) {
            message.reply({ components: [V2.container(["❌ Failed to clear messages. Messages may be older than 14 days."])] });
        }
    }
};
