const {
    EmbedBuilder,
    PermissionsBitField,
    SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../data/automod.json");

function load() {
    if (!fs.existsSync(DB)) return {};
    return JSON.parse(fs.readFileSync(DB));
}

function save(data) {
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

function defaults() {
    return {
        enabled: false,
        punishment: "mute",

        modules: {
            spam: true,
            caps: true,
            links: true,
            invites: true,
            mentions: true,
            emoji: true,
            nsfw: true
        }
    };
}

function icon(v) {
    return v ? "✅" : "❌";
}

function punish(member, type) {

    if (type === "mute") {
        member.timeout(600000).catch(() => { })
    }

    if (type === "kick") {
        member.kick().catch(() => { })
    }

    if (type === "ban") {
        member.ban().catch(() => { })
    }

}

module.exports = {

    name: "automod",
    description: "Ultimate automod system",

    permissions: [PermissionsBitField.Flags.ManageGuild],

    data: new SlashCommandBuilder()
        .setName("automod")
        .setDescription("Manage automod")

        .addSubcommand(s => s.setName("enable").setDescription("Enable automod"))
        .addSubcommand(s => s.setName("disable").setDescription("Disable automod"))
        .addSubcommand(s => s.setName("config").setDescription("View automod settings"))

        .addSubcommand(s =>
            s.setName("punishment")
                .setDescription("Set punishment")
                .addStringOption(o =>
                    o.setName("type")
                        .setDescription("Choose the punishment type")
                        .setRequired(true)
                        .addChoices(
                            { name: "mute", value: "mute" },
                            { name: "kick", value: "kick" },
                            { name: "ban", value: "ban" }
                        ))),

    // PREFIX COMMAND
    async execute(message, args) {

        const db = load();
        const guild = message.guild.id;

        if (!db[guild]) {
            db[guild] = defaults();
        } else {
            if (!db[guild].modules) db[guild].modules = defaults().modules;
            if (!db[guild].punishment) db[guild].punishment = defaults().punishment;
        }

        const settings = db[guild];

        if (!args[0]) {

            const embed = new EmbedBuilder()

                .setColor("#ff0000")
                .setTitle("🛡 AUTOMOD GROUP")

                .setDescription(`
\`!automod enable\`
Enable automod protection

\`!automod disable\`
Disable automod protection

\`!automod config\`
View automod configuration

\`!automod punishment <mute|kick|ban>\`
Set automod punishment
`);

            return message.reply({ embeds: [embed] });
        }

        const sub = args[0].toLowerCase();

        if (sub === "enable") {
            settings.enabled = true;
            save(db);

            return message.reply({

                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("✔ Automod Enabled")
                        .setDescription(`
${icon(settings.modules.spam)} Anti Spam
${icon(settings.modules.caps)} Anti Caps
${icon(settings.modules.links)} Anti Links
${icon(settings.modules.invites)} Anti Invites
${icon(settings.modules.mentions)} Anti Mentions
${icon(settings.modules.emoji)} Anti Emoji Spam
${icon(settings.modules.nsfw)} Anti NSFW Links
`)
                ]

            });
        }

        if (sub === "disable") {

            settings.enabled = false;
            save(db);

            return message.reply({

                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("❌ Automod Disabled")
                ]

            });
        }

        if (sub === "config") {

            return message.reply({

                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle(`Automod Settings`)

                        .addFields(

                            {
                                name: "Status",
                                value: settings.enabled ? "🟢 Enabled" : "🔴 Disabled"
                            },

                            {
                                name: "Modules",
                                value: `
${icon(settings.modules.spam)} Anti Spam
${icon(settings.modules.caps)} Anti Caps
${icon(settings.modules.links)} Anti Links
${icon(settings.modules.invites)} Anti Invites
${icon(settings.modules.mentions)} Anti Mentions
${icon(settings.modules.emoji)} Anti Emoji Spam
${icon(settings.modules.nsfw)} Anti NSFW Links
`
                            },

                            {
                                name: "Punishment",
                                value: settings.punishment
                            }

                        )

                ]

            });
        }

        if (sub === "punishment") {

            const type = args[1];

            if (!["mute", "kick", "ban"].includes(type))
                return message.reply("Choose mute | kick | ban");

            settings.punishment = type;

            save(db);

            return message.reply({

                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("⚖ Punishment Updated")
                        .setDescription(`New punishment: **${type}**`)
                ]

            });
        }

    },

    // SLASH COMMAND
    async slashExecute(interaction) {

        const db = load();
        const guild = interaction.guild.id;

        if (!db[guild]) {
            db[guild] = defaults();
        } else {
            if (!db[guild].modules) db[guild].modules = defaults().modules;
            if (!db[guild].punishment) db[guild].punishment = defaults().punishment;
        }

        const settings = db[guild];

        const sub = interaction.options.getSubcommand();

        if (sub === "enable") settings.enabled = true;
        if (sub === "disable") settings.enabled = false;

        if (sub === "punishment")
            settings.punishment = interaction.options.getString("type");

        save(db);

        if (sub === "config") {

            return interaction.reply({

                embeds: [
                    new EmbedBuilder()
                        .setColor("#ff0000")
                        .setTitle("Automod Settings")

                        .setDescription(`
Status: ${settings.enabled ? "🟢 Enabled" : "🔴 Disabled"}

${icon(settings.modules.spam)} Anti Spam
${icon(settings.modules.caps)} Anti Caps
${icon(settings.modules.links)} Anti Links
${icon(settings.modules.invites)} Anti Invites
${icon(settings.modules.mentions)} Anti Mentions
${icon(settings.modules.emoji)} Anti Emoji Spam
${icon(settings.modules.nsfw)} Anti NSFW Links

Punishment: **${settings.punishment}**
`)
                ]

            });
        }

        interaction.reply({

            embeds: [
                new EmbedBuilder()
                    .setColor("#ff0000")
                    .setDescription("✅ Automod updated")
            ]

        });

    },

    // MESSAGE PROTECTION
    async messageHandler(message) {

        if (!message.guild) return;
        if (message.author.bot) return;

        const db = load();
        const settings = db[message.guild.id];

        if (!settings || !settings.enabled || !settings.modules) return;

        const msg = message.content.toLowerCase();

        // links
        if (settings.modules.links) {
            if (msg.includes("http://") || msg.includes("https://")) {
                message.delete().catch(() => { });
                punish(message.member, settings.punishment);
                return;
            }
        }

        // invites
        if (settings.modules.invites) {
            if (msg.includes("discord.gg")) {
                message.delete().catch(() => { });
                punish(message.member, settings.punishment);
                return;
            }
        }

        // caps
        if (settings.modules.caps) {

            let caps = message.content.replace(/[^A-Z]/g, "").length;
            let percent = caps / message.content.length * 100;

            if (percent > 70) {
                message.delete().catch(() => { });
                punish(message.member, settings.punishment);
                return;
            }

        }

        // mentions
        if (settings.modules.mentions) {

            if (message.mentions.users.size >= 5) {
                message.delete().catch(() => { });
                punish(message.member, settings.punishment);
            }

        }

        // emoji spam
        if (settings.modules.emoji) {

            const emojis = message.content.match(/<a?:\w+:\d+>/g);

            if (emojis && emojis.length >= 6) {
                message.delete().catch(() => { });
                punish(message.member, settings.punishment);
            }

        }

        // nsfw links
        if (settings.modules.nsfw) {

            const nsfwWords = ["porn", "xvideos", "xnxx", "rule34"];

            for (const w of nsfwWords) {

                if (msg.includes(w)) {
                    message.delete().catch(() => { });
                    punish(message.member, settings.punishment);
                }

            }

        }

    }

};
