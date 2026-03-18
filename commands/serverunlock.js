const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
module.exports = {
    name: "serverunlock",
    description: "Unlocks the entire server",
    usage: "!serverunlock",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const botAvatar = message.client.user.displayAvatarURL();
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ components: [V2.container(["🚫 **ACCESS DENIED:** Administrator required."])] });
        }

        const channels = message.guild.channels.cache.filter(c => c.type === 0);

        const msg = await message.reply({
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔓 UNLOCK INITIATED...").setDescription("Lifting security overrides in parallel...").setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        const results = await Promise.allSettled(
            channels.map(ch => ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }, { reason: `Server Unlock by ${message.author.tag}` }).catch(() => { }))
        );
        const unlockedCount = results.filter(r => r.status === "fulfilled").length;

        return msg.edit({
            components: [V2.container([
                V2.section([
                    "🔓 SERVER UNLOCKED",
                    `\`\`\`yml\nSTATUS:   OPERATIONAL\nACCESS:   GRANTED\n\`\`\``
                ], botAvatar),
                `> **Channels Restored:** \`${unlockedCount}\`\n> **Normal communications may resume.**`
            ])]
        });
    }
};
