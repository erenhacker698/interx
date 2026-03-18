const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "setupverify",
    description: "Setup the premium verification panel",
    usage: "!setupverify #channel @role",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && (message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

        if (!channel || !role)
            return message.reply({ components: [V2.container(["⚠️ **Usage:** `!setupverify #channel @role`"])] });

        // ───── PREMIUM DESIGN CONSTRUCTION ─────
        // (1) ActionRowBuilder for the Verify Button
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`verify_${role.id}`)
                .setLabel("✅ Verify Membership")
                .setStyle(ButtonStyle.Success)
        );

        // (2) Builder Ensemble: Container, Section, Heading, Text, Separator, Thumbnail
        const verifyPanel = V2.container([
            // Header Section with Thumbnail
            V2.section([
                "🛡️ SOVEREIGN GATEWAY",
                "Biometric & Identity Authentication Required"
            ], V2.thumbnail(message.guild.iconURL({ dynamic: true, size: 512 }) || message.client.user.displayAvatarURL())),

            // Info Section
            "To access the restricted sectors of this dominion, you must verify your identity. This process ensures the integrity and security of the Sovereign network.\n\n> **Authorized Access Only**",

            // Guidelines Section
            V2.section([
                V2.text("**Identity Registry:** You will be granted the role: " + role.name),
                "**Security Protocol:** By verifying, you commit to honoring all Imperial Statutes."
            ]),

            // Final Action Row (7th Builder usage)
            row
        ]);

        try {
            await channel.send({
                components: [verifyPanel]
            });

            return message.reply({
                components: [V2.container([`💎 **Sovereign Gateway synchronized with ${channel}.**\nRegistry Role: ${role}`])]
            });
        } catch (e) {
            console.error("SetupVerify Error:", e);
            return message.reply({ content: "❌ Failed to send panel. Ensure the bot has permissions in that channel." });
        }
    }
};
