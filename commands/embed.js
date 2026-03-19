const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');

module.exports = {
    name: "embed",
    description: "Create a custom interX themed embed message.",
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Construct a high-clearance interX security embed.')
        .addStringOption(opt => opt.setName('description').setDescription('The main message content').setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('The embed title').setRequired(false))
        .addChannelOption(opt => opt.setName('channel').setDescription('Target sector for transmission').addChannelTypes(ChannelType.GuildText).setRequired(false))
        .addStringOption(opt => opt.setName('footer').setDescription('Custom sub-protocol text (footer)').setRequired(false))
        .addStringOption(opt => opt.setName('thumbnail').setDescription('Thumbnail link (URL)').setRequired(false))
        .addStringOption(opt => opt.setName('image').setDescription('Main background image link (URL)').setRequired(false))
        .addStringOption(opt => opt.setName('color').setDescription('Hex override (Defaults to interX Red)').setRequired(false)),

    async execute(message, args, client) {
        // Handle both Message and Ineraction (Shim provides .options for interaction)
        const isInteraction = !!message.options;
        const guild = message.guild;
        const member = message.member;

        // Permission check
        if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            const error = "🚫 **Unauthorized:** `Manage Messages` clearance required.";
            return isInteraction ? message.reply({ content: error, ephemeral: true }) : message.reply(error);
        }

        let title, description, channel, footer, thumbnail, image, color;

        if (isInteraction) {
            title = message.options.getString('title');
            description = message.options.getString('description');
            channel = message.options.getChannel('channel') || message.channel;
            footer = message.options.getString('footer');
            thumbnail = message.options.getString('thumbnail');
            image = message.options.getString('image');
            color = message.options.getString('color') || "#FF0000";
        } else {
            // Basic prefix support for !embed (just description for now as it's a complex command)
            description = args.join(" ");
            channel = message.channel;
            color = "#FF0000";
            if (!description) return message.reply("⚠️ Usage: `!embed <content>` or use the slash command `/embed` for advanced styling.");
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setDescription(description)
            .setTimestamp();

        if (title) embed.setTitle(`🛡️ [ ${title.toUpperCase()} ]`);
        if (footer) embed.setFooter({ text: `interX • ${footer}` });
        else embed.setFooter({ text: "interX • Security Protocol" });

        if (thumbnail) {
            try { new URL(thumbnail); embed.setThumbnail(thumbnail); } catch (e) { }
        }
        if (image) {
            try { new URL(image); embed.setImage(image); } catch (e) { }
        }

        try {
            await channel.send({ embeds: [embed] });
            if (isInteraction) {
                await message.reply({ content: `✅ **Transmission Successful:** Packet delivered to ${channel}.`, ephemeral: true });
            } else {
                if (message.deletable) await message.delete().catch(() => { });
            }
        } catch (err) {
            const failMsg = `❌ **ERROR:** Transmission failed. Sector unreachable or permissions deficient.`;
            return isInteraction ? message.reply({ content: failMsg, ephemeral: true }) : message.reply(failMsg);
        }
    }
};
