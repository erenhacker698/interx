const { PermissionsBitField, EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const configPath = './antinuke-config.json';

function loadConfig() {
    if (!fs.existsSync(configPath)) {
        const def = {
            enabled: true,
            punishment: 'ban',
            exemptRoles: [],
        };
        fs.writeFileSync(configPath, JSON.stringify(def, null, 2));
        return def;
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(AN_DB, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "antinuke",
    description: "Configure the interX Anti-Nuke system.",
    aliases: ["an"],
    permissions: [PermissionsBitField.Flags.Administrator],

    data: new SlashCommandBuilder()
        .setName("antinuke")
        .setDescription("Configure Anti-Nuke system")
        .addSubcommand(s => s.setName("on").setDescription("Enable Anti-Nuke"))
        .addSubcommand(s => s.setName("off").setDescription("Disable Anti-Nuke"))
        .addSubcommand(s => s.setName("status").setDescription("Check Anti-Nuke status"))
        .addSubcommand(s => s.setName("punishment")
            .setDescription("Set punishment type")
            .addStringOption(o => o.setName("type").setDescription("ban, kick, or demote").setRequired(true)
                .addChoices({ name: 'Ban', value: 'ban' }, { name: 'Kick', value: 'kick' }, { name: 'Demote', value: 'demote' })))
        .addSubcommand(s => s.setName("wl")
            .setDescription("Manage whitelisted roles")
            .addStringOption(o => o.setName("action").setDescription("add or remove").setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addRoleOption(o => o.setName("role").setDescription("The role to manage").setRequired(true))),

    async slashExecute(interaction) {
        if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator))
            return interaction.reply({ content: "❌ **Admin only**", ephemeral: true });

        const config = loadConfig();
        const sub = interaction.options.getSubcommand();
        const RED = "#ec0e0e";

        if (sub === "status") {
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Nuke System Status')
                .setColor(config.enabled ? RED : "#e74c3c")
                .addFields(
                    { name: "Sovereign Shield", value: config.enabled ? "🟢 **ACTIVE**" : "🔴 **OFFLINE**", inline: true },
                    { name: "Execution Protocol", value: `\`${config.punishment.toUpperCase()}\``, inline: true },
                    { name: "Whitelisted Roles", value: config.exemptRoles.length > 0 ? config.exemptRoles.map(id => `<@&${id}>`).join(", ") : "None", inline: false }
                )
                .setFooter({ text: "interX • Red Protocol Security" })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "on") {
            config.enabled = true;
            saveConfig(config);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ca0000").setDescription("✅ **Shields Activated:** Anti Nuke system is now monitoring all administrative events.")] });
        }

        if (sub === "off") {
            config.enabled = false;
            saveConfig(config);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription("⚠️ **Shields Disabled:** The server is now exposed to administrative manipulation.")] });
        }

        if (sub === "punishment") {
            const type = interaction.options.getString("type");
            config.punishment = type;
            saveConfig(config);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff1c1c").setDescription(`⚙️ **Punishment Updated:** Punishment set to \`${type.toUpperCase()}\`.`)] });
        }

        if (sub === "wl") {
            const action = interaction.options.getString("action");
            const role = interaction.options.getRole("role");

            if (action === "add") {
                if (!config.exemptRoles.includes(role.id)) {
                    config.exemptRoles.push(role.id);
                    saveConfig(config);
                    return interaction.reply({ embeds: [new EmbedBuilder().setColor("#ff0000").setDescription(`✅ **Access Granted:** ${role} is now immune to Anti-Nuke protocols.`)] });
                }
                return interaction.reply({ content: "Role already has immunity.", ephemeral: true });
            }

            if (action === "remove") {
                config.exemptRoles = config.exemptRoles.filter(id => id !== role.id);
                saveConfig(config);
                return interaction.reply({ embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription(`❌ **Access Revoked:** ${role} immunity has been terminated.`)] });
            }
        }
    },

    async execute(message, args) {
        const config = loadConfig();
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === "status" || sub === "settings") {
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Nuke System Status')
                .setColor(config.enabled ? "#df0000" : "#e74c3c")
                .addFields(
                    { name: "Sovereign Shield", value: config.enabled ? "🟢 **ACTIVE**" : "🔴 **OFFLINE**", inline: true },
                    { name: "Execution Protocol", value: `\`${config.punishment.toUpperCase()}\``, inline: true },
                    { name: "Whitelisted Roles", value: config.exemptRoles.length > 0 ? config.exemptRoles.map(id => `<@&${id}>`).join(", ") : "None", inline: false }
                )
                .setFooter({ text: "interX • Red Protocol Security" })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        if (sub === "on" || sub === "enable") {
            config.enabled = true;
            saveConfig(config);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#df0000").setDescription("✅ **Shields Activated:** Anti Nuke system is now monitoring all administrative events.")] });
        }

        if (sub === "off" || sub === "disable") {
            config.enabled = false;
            saveConfig(config);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#e74c3c").setDescription("⚠️ **Shields Disabled:** The server is now exposed to administrative manipulation.")] });
        }

        if (sub === "punishment" || sub === "mode") {
            const mode = args[1]?.toLowerCase();
            if (!["ban", "kick", "demote"].includes(mode)) {
                return message.reply("🚫 **Invalid Mode:** Choose between `ban`, `kick`, or `demote`.");
            }
            config.punishment = mode;
            saveConfig(config);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#df0000").setDescription(`⚙️ **Punishment Updated:** Punishment set to \`${mode.toUpperCase()}\`.`)] });
        }

        if (sub === "whitelist" || sub === "exempt" || sub === "wl") {
            const action = args[1]?.toLowerCase();
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

            if (action === "add" && role) {
                if (!config.exemptRoles.includes(role.id)) {
                    config.exemptRoles.push(role.id);
                    saveConfig(config);
                    return message.reply({ embeds: [new EmbedBuilder().setColor("#df0000").setDescription(`✅ **Access Granted:** ${role} is now immune to Anti-Nuke protocols.`)] });
                }
                return message.reply("Skipping: Role already has immunity.");
            }

            if (action === "remove" && role) {
                config.exemptRoles = config.exemptRoles.filter(id => id !== role.id);
                saveConfig(config);
                return message.reply({ embeds: [new EmbedBuilder().setColor("#df0000").setDescription(`❌ **Access Revoked:** ${role} immunity has been terminated.`)] });
            }

            if (action === "list") {
                const roles = config.exemptRoles.length > 0 ? config.exemptRoles.map(id => `<@&${id}>`).join("\n") : "No roles whitelisted.";
                const embed = new EmbedBuilder()
                    .setColor("#df0000")
                    .setTitle("📜 [ ANTI_NUKE_IMMUNE_ROLES ]")
                    .setDescription(`### **Exempt Authority Roles**\n\n${roles}`)
                    .setFooter({ text: "interX • Shield Protocol" });
                return message.reply({ embeds: [embed] });
            }

            return message.reply("Usage: `!antinuke wl add/remove @role` or `!antinuke wl list`.");
        }

        // Help menu if no valid subcommand
        const helpEmbed = new EmbedBuilder()
            .setTitle("🛡️ Anti-Nuke Control Interface")
            .setColor("#fa0202")
            .setDescription("Manage the Sovereign Anti-Nuke Shield.")
            .addFields(
                { name: "Commands", value: "`!antinuke on/off` - Toggle the system\n`!antinuke status` - View current settings\n`!antinuke mode <ban|kick|demote>` - Set punishment\n`!antinuke wl add/remove @role` - Manage immune roles" }
            )
            .setFooter({ text: "interX • Security Matrix" });
        return message.reply({ embeds: [helpEmbed] });
    }
};
