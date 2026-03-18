const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "serverlock",
    description: "Locks the entire server",
    usage: "!serverlock [reason]",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ components: [V2.container(["🚫 **ACCESS DENIED:** Administrator required."])] });
        }

        const reason = args.join(" ") || "Administrative Lockdown Protocol";
        const channels = message.guild.channels.cache.filter(c => c.type === 0);

        const msg = await message.reply({
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔒 LOCKDOWN INITIATED...").setDescription("Processing channel overrides in parallel...").setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        const results = await Promise.allSettled(
            channels.map(ch => ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason: `Server Lock: ${reason}` }).catch(() => { }))
        );
        const lockedCount = results.filter(r => r.status === "fulfilled").length;

        return msg.edit({
            components: [V2.container([
                V2.section([
                    "🔒 SERVER LOCKDOWN COMPLETE",
                    `\`\`\`yml\nSTATUS:   LOCKED\nACCESS:   RESTRICTED\nREASON:   ${reason}\n\`\`\``
                ], botAvatar),
                `> **Channels Affected:** \`${lockedCount}\`\n> **Only Admins may communicate.**`
            ])]
        });
    }
};
