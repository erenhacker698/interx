const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder, ChannelType } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

const SUPPORT_ROLE = "1482305056484102238";
const TICKET_CATEGORY = "1482304600907452517";

module.exports = {
    name: "ticketpanel",
    description: "Deploy the Ticket System panel",
    aliases: ["ticket", "support"],
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const isBypass = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBypass && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Access Denied: Administrator privileges required.");
        }

        const embed = new EmbedBuilder()
            .setTitle("Support Tickets")
            .setDescription("Press the button below to create a support ticket.\nOur staff will help you shortly.")
            .setColor("Red")
            .setFooter({ text: "Ticket System" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("open_ticket")
                .setLabel("Open Ticket")
                .setEmoji("ticket")
                .setStyle(ButtonStyle.Danger)
        );

        message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
};
