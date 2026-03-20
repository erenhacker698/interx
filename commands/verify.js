const {
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "verify",
    description: "Deploy a one-click verification panel in a channel.",
    aliases: ["verification", "vsetup"],
    usage: "!verify #channel @role",
    permissions: [PermissionsBitField.Flags.Administrator],

    // ───── SLASH COMMAND ─────
    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription("Deploy a one-click verification panel")
        .addChannelOption(o =>
            o.setName("channel")
                .setDescription("Channel to send the verify panel in")
                .setRequired(true)
        )
        .addRoleOption(o =>
            o.setName("role")
                .setDescription("Role to give on verification")
                .setRequired(true)
        ),

    // ───── SLASH HANDLER ─────
    async slashExecute(interaction) {
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator))
            return interaction.reply({ content: "❌ **Admin only.**", ephemeral: true });

        const channel = interaction.options.getChannel("channel");
        const role = interaction.options.getRole("role");

        if (!channel || !role)
            return interaction.reply({ content: "❌ **Invalid channel or role.**", ephemeral: true });

        const result = await sendVerifyPanel(interaction.guild, channel, role, interaction.client);
        if (!result.success) {
            return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor("#df0000")
            .setDescription(
                `✅ **Verification panel deployed!**\n\n` +
                `> **Channel:** ${channel}\n` +
                `> **Role:** ${role}`
            )
            .setFooter({ text: "interX • Verification System" })
            .setTimestamp();

        return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
    },

    // ───── PREFIX HANDLER ─────
    async execute(message, args) {
        const isAuthorized =
            message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            message.author.id === BOT_OWNER_ID ||
            message.author.id === BOT_DEV_ID;

        if (!isAuthorized) {
            const denied = new EmbedBuilder()
                .setColor("#df0000")
                .setDescription("🔒 **Access Denied** — Administrator permission required.")
                .setFooter({ text: "interX • Verification System" });
            return message.reply({ embeds: [denied] });
        }

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

        if (!channel || !role) {
            const usage = new EmbedBuilder()
                .setColor("#df0000")
                .setAuthor({
                    name: `${message.client.user.username} • Verification`,
                    iconURL: message.client.user.displayAvatarURL({ dynamic: true })
                })
                .setDescription(
                    `**Setup a one-click verification panel.**\n\n` +
                    `> **Usage:** \`!verify #channel @role\`\n` +
                    `> **Example:** \`!verify #verify @Member\`\n\n` +
                    `The bot will send a verification embed in the specified channel. ` +
                    `When a user clicks **Verify**, they receive the role automatically.`
                )
                .setFooter({ text: "interX • Verification System" })
                .setTimestamp();
            return message.reply({ embeds: [usage] });
        }

        const result = await sendVerifyPanel(message.guild, channel, role, message.client);
        if (!result.success) {
            return message.reply({ content: `❌ ${result.error}` });
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor("#df0000")
            .setDescription(
                `✅ **Verification panel deployed!**\n\n` +
                `> **Channel:** ${channel}\n` +
                `> **Role:** ${role}`
            )
            .setFooter({ text: "interX • Verification System" })
            .setTimestamp();

        return message.reply({ embeds: [confirmEmbed] });
    }
};

// ───── PANEL BUILDER ─────
async function sendVerifyPanel(guild, channel, role, client) {
    const panelEmbed = new EmbedBuilder()
        .setColor("#df0000")
        .setAuthor({
            name: guild.name,
            iconURL: guild.iconURL({ dynamic: true }) || undefined
        })
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setTitle("🔐 Verification Required")
        .setDescription(
            `Welcome to **${guild.name}**!\n\n` +
            `To access the server, click the button below to verify your identity.\n\n` +
            `> 🛡️ **Role granted:** \`${role.name}\`\n` +
            `> ⚡ **One-click** — instant access`
        )
        .setImage("https://media.discordapp.net/attachments/1093150036663308318/1113885934572900454/line-red.gif")
        .setFooter({ text: "interX • Click below to verify" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`verify_${role.id}`)
            .setLabel("✅ Verify")
            .setStyle(ButtonStyle.Danger)
    );

    try {
        await channel.send({ embeds: [panelEmbed], components: [row] });
        return { success: true };
    } catch (e) {
        console.error("[Verify Error]:", e.message);
        return { success: false, error: "Failed to send panel. Check bot permissions in that channel." };
    }
}
