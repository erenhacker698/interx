const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { BOT_OWNER_ID } = require("../config");

module.exports = {
    name: "autorole",
    description: "Configure automated role assignment for new server members.",
    usage: "!autorole <set @role | off | status>",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Administrator privileges required." });
        }

        const DB_PATH = path.join(__dirname, "../data/autorole.json");
        const dataDir = path.join(__dirname, "../data");

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        let data = {};
        if (fs.existsSync(DB_PATH)) {
            try { data = JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch (e) { }
        }

        const sub = args[0]?.toLowerCase();

        // 1. SET AUTOROLE
        if (sub === "set" || sub === "add") {
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

            if (!role) {
                const errorEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle("❌ ERROR: MISSING_ROLE")
                    .setDescription("> **You must mention or provide a valid Role ID to initialize the automation.**\n\nUsage: `!autorole set @role`")
                    .setFooter({ text: "interX • Configuration Node" });
                return message.reply({ embeds: [errorEmbed] });
            }

            if (role.position >= message.guild.members.me.roles.highest.position) {
                const hierarchyEmbed = new EmbedBuilder()
                    .setColor("#FF0000")
                    .setTitle("🚫 HIERARCHY_VIOLATION")
                    .setDescription(`> **The role ${role} sits above my clearance level.**\n\nMove my role above it in Server Settings to restore management capabilities.`)
                    .setFooter({ text: "interX • Security Protocols" });
                return message.reply({ embeds: [hierarchyEmbed] });
            }

            data[message.guild.id] = role.id;
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

            const successEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setAuthor({ name: "interX | Automation Initialized", iconURL: message.client.user.displayAvatarURL() })
                .setTitle("👤 [ AUTOROLE_PROTOCOL_ACTIVE ]")
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setDescription(
                    `### **Member Onboarding Synced**\n\n` +
                    `> **Target Role:** ${role} (\`${role.id}\`)\n` +
                    `> **Status:** Active & Monitoring\n\n` +
                    `New users entering the server will be automatically assigned this role by the interX Sovereign System.`
                )
                .setFooter({ text: "interX Sovereign • Seamless Integration" })
                .setTimestamp();

            return message.reply({ embeds: [successEmbed] });
        }

        // 2. DISABLE AUTOROLE
        if (sub === "off" || sub === "disable" || sub === "stop") {
            if (!data[message.guild.id]) {
                return message.reply({ content: "⚠️ **Status:** Autorole is already offline for this sector." });
            }

            delete data[message.guild.id];
            fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

            const offEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("⚠️ [ AUTOROLE_PROTOCOL_TERMINATED ]")
                .setDescription("> **Automatic onboarding has been deactivated.**\n\nNew members will no longer receive roles upon entry until the system is re-initialized.")
                .setTimestamp();

            return message.reply({ embeds: [offEmbed] });
        }

        // 3. STATUS
        const roleId = data[message.guild.id];
        const role = roleId ? message.guild.roles.cache.get(roleId) : null;

        const statusEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setAuthor({ name: "interX | System Telemetry", iconURL: message.client.user.displayAvatarURL() })
            .setTitle("👤 [ AUTOROLE_DIAGNOSTIC ]")
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(
                `### **Automation Node Status**\n\n` +
                `> **Global Status:** ${role ? "🟢 ACTIVE" : "🔴 INACTIVE"}\n` +
                `> **Target Role:** ${role ? role : "`None`"}\n` +
                `> **Hierarchy Sync:** ${role ? (role.position < message.guild.members.me.roles.highest.position ? "✅ SECURE" : "⚠️ OUT OF RANK") : "N/A"}\n\n` +
                `**Commands:**\n` +
                `\`!autorole set @role\` • Enable\n` +
                `\`!autorole off\` • Disable`
            )
            .setFooter({ text: "interX Sovereign • Optimized User Flow" })
            .setTimestamp();

        return message.reply({ embeds: [statusEmbed] });
    }
};
