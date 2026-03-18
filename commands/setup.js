const { EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");

module.exports = {
    name: "setup",
    description: "Auto setup security system",

    async execute(message) {

        // 🔒 Only admins
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ You need Administrator permission.");
        }

        const guild = message.guild;

        // 🔍 Check if already exists
        let logChannel = guild.channels.cache.find(c => c.name === "ghost-logs");

        if (!logChannel) {
            // 📁 Create channel
            logChannel = await guild.channels.create({
                name: "ghost-logs",
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: message.author.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: guild.members.me.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.EmbedLinks
                        ],
                    },
                ],
            });
        }

        // 🔴 Success Embed
        const embed = new EmbedBuilder()
            .setColor("#ff0101ff")
            .setTitle("⚙️ SECURITY SYSTEM SETUP")
            .setDescription("Ghost Logger + Security system initialized.")
            .addFields(
                { name: "📁 Log Channel", value: `${logChannel}`, inline: false },
                { name: "🔒 Privacy", value: "Hidden from members", inline: false },
                { name: "🛡️ Status", value: "Protection Enabled", inline: false }
            )
            .setFooter({ text: "Auto Setup Complete" })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};