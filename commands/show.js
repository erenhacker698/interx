const { PermissionsBitField, AttachmentBuilder, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "show",
    description: "Unhides the current channel for @everyone",
    aliases: ["showchannel", "view", "unlockview"],
    permissions: PermissionsBitField.Flags.ManageChannels,

    async execute(message, args) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.id, {
                ViewChannel: true
            });

            const { AttachmentBuilder } = require("discord.js");
            const showIcon = new AttachmentBuilder("./assets/show.png", { name: "show.png" });

            // Using global V2
            const container = V2.container([
                V2.section([
                    "👀 CHANNEL VISIBLE",
                    `** Status:** \`VISIBLE\`\n**Target:** \`@everyone\`\n**Access:** \`Public Access Restored\``
                ], "attachment://show.png"), // Premium Blue Eye
                `> **Authorized By:** ${message.author}\n> **Time:** <t:${Math.floor(Date.now() / 1000)}:f>`,
                "*interX • Visibility Protocol*"
            ], "#0099ff");

            await message.channel.send({ content: null, files: [showIcon], components: [container] });

        } catch (e) {
            console.error(e);
            // Using global V2
            message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("❌ **Error: Missing Permissions or Hierarchy issue.**").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
