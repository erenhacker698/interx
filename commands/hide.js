const { PermissionsBitField, EmbedBuilder } = require("discord.js");
module.exports = {
    name: "hide",
    description: "Hides the current channel from @everyone",
    aliases: ["hidechannel", "lockview"],
    permissions: PermissionsBitField.Flags.ManageChannels,

    async execute(message, args) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.id, {
                ViewChannel: false
            });

            const { AttachmentBuilder } = require("discord.js");
            const hideIcon = new AttachmentBuilder("./assets/hide.png", { name: "hide.png" });

            const hideContainer = new EmbedBuilder().setColor(0xFF0033).setTitle("🙈 VISIBILITY REVOKED").setDescription(`**Status:** Hidden from @everyone\n**Access:** Revoked`).addFields({ name: "📋 Details", value: `**Authorized By:** ${message.author.tag}` }).setFooter({ text: "interX • Security" }).setTimestamp(); // Blue

            await message.channel.send({
                content: null,
                files: [hideIcon], // Attach the file
                components: [hideContainer]
            });

        } catch (e) {
            console.error(e);
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("❌ SYSTEM ERROR").setDescription("Missing Permissions or Hierarchy issue.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }
    }
};
