const {
    EmbedBuilder,
    PermissionsBitField,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
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
            spam: false,
            caps: false,
            links: false,
            invites: false,
            mentions: false,
            emoji: false,
            nsfw: false
        }
    };
}

function punish(member, type) {
    if (!member) return;
    if (type === "mute") {
        member.timeout(600000).catch(() => { });
    }
    if (type === "kick") {
        member.kick().catch(() => { });
    }
    if (type === "ban") {
        member.ban().catch(() => { });
    }
}

function generateDescription(settings) {
    const icon = (state) => state ? "⬛ ✅" : "❌ ⬛";
    
    return `
${icon(settings.modules.spam)} : Anti spam
${icon(settings.modules.caps)} : Anti caps
${icon(settings.modules.links)} : Anti link
${icon(settings.modules.invites)} : Anti invites
${icon(settings.modules.mentions)} : Anti mass mention
${icon(settings.modules.emoji)} : Anti emoji spam
${icon(settings.modules.nsfw)} : Anti NSFW link
`;
}

function generateComponents(state) {
    if (state === "setup") {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("automod_select")
            .setPlaceholder("Select events to enable")
            .setMinValues(0)
            .setMaxValues(7)
            .addOptions([
                { label: "Anti spam", value: "spam" },
                { label: "Anti caps", value: "caps" },
                { label: "Anti link", value: "links" },
                { label: "Anti invites", value: "invites" },
                { label: "Anti mass mention", value: "mentions" },
                { label: "Anti emoji spam", value: "emoji" },
                { label: "Anti NSFW link", value: "nsfw" }
            ]);

        const Buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("automod_enable_all")
                .setLabel("Enable for All Events")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("automod_cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger)
        );

        return [new ActionRowBuilder().addComponents(selectMenu), Buttons];
    } else if (state === "success") {
        const Buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("automod_show_rules")
                .setLabel("Show Rules")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("automod_enable_log")
                .setLabel("Enable Automod Logging")
                .setStyle(ButtonStyle.Success)
        );
        return [new ActionRowBuilder().addComponents(Buttons.components[0], Buttons.components[1])]; // ensure action row format
    }
}

async function sendSetup(context, db, guildId, userId) {
    const settings = db[guildId];

    const embed = new EmbedBuilder()
        .setColor("#2B2D31")
        .setTitle("interX's Automod Setup")
        .setThumbnail(context.client.user.displayAvatarURL())
        .setDescription(generateDescription(settings));

    const replyOptions = {
        embeds: [embed],
        components: generateComponents("setup"),
        fetchReply: true
    };

    let msg;
    try {
        if (context.replied || context.deferred) {
            msg = await context.followUp(replyOptions);
        } else {
            msg = await context.reply(replyOptions);
        }
    } catch (err) {
        if (context.channel) msg = await context.channel.send(replyOptions);
    }

    if (!msg) return;

    const collector = msg.createMessageComponentCollector({
        filter: (i) => i.user.id === userId,
        time: 300000
    });

    collector.on("collect", async (i) => {
        if (i.customId === "automod_cancel") {
            await i.update({ embeds: [new EmbedBuilder().setTitle("Automod Setup Cancelled").setColor("#FF3131")], components: [] });
            collector.stop();
        }

        if (i.customId === "automod_enable_all") {
            for (let key in settings.modules) {
                settings.modules[key] = true;
            }
            settings.enabled = true;
            save(db);

            embed.setTitle("Automod Enabled Successfully")
                .setDescription(generateDescription(settings));

            await i.update({ embeds: [embed], components: generateComponents("success") });
        }

        if (i.customId === "automod_select") {
            const selected = i.values;
            for (let key in settings.modules) {
                settings.modules[key] = false;
            }
            selected.forEach(val => {
                if (settings.modules[val] !== undefined) {
                    settings.modules[val] = true;
                }
            });
            
            settings.enabled = selected.length > 0;
            save(db);

            embed.setTitle("Automod Enabled Successfully")
                .setDescription(generateDescription(settings));

            await i.update({ embeds: [embed], components: generateComponents("success") });
        }

        if (i.customId === "automod_show_rules") {
            await i.reply({ content: "**Current Automod Rules:**\n" + generateDescription(settings), ephemeral: true });
        }

        if (i.customId === "automod_enable_log") {
            await i.reply({ content: "Logging feature will be integrated soon! Stay tuned.", ephemeral: true });
        }
    });

    collector.on("end", () => {
        // optionally disable components when time expires
    });
}

module.exports = {

    name: "automod",
    description: "Ultimate automod system",

    permissions: [PermissionsBitField.Flags.ManageGuild],

    data: new SlashCommandBuilder()
        .setName("automod")
        .setDescription("Manage automod")
        .addSubcommand(s => s.setName("setup").setDescription("Interactive automod setup"))
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

        if (!args[0] || args[0].toLowerCase() === "setup") {
            return sendSetup(message, db, guild, message.author.id);
        }

        const settings = db[guild];
        const sub = args[0].toLowerCase();

        if (sub === "enable") {
            settings.enabled = true;
            save(db);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#00FF00").setTitle("✔ Automod Enabled")] });
        }

        if (sub === "disable") {
            settings.enabled = false;
            save(db);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#FF0000").setTitle("❌ Automod Disabled")] });
        }

        if (sub === "config") {
            return sendSetup(message, db, guild, message.author.id);
        }

        if (sub === "punishment") {
            const type = args[1];
            if (!["mute", "kick", "ban"].includes(type))
                return message.reply("Choose mute | kick | ban");
            settings.punishment = type;
            save(db);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#ff0000").setTitle("⚖ Punishment Updated").setDescription(`New punishment: **${type}**`)] });
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

        if (sub === "setup" || sub === "config") {
            return sendSetup(interaction, db, guild, interaction.user.id);
        }

        if (sub === "enable") {
            settings.enabled = true;
            save(db);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#00FF00").setDescription("✅ Automod enabled")] });
        }
        
        if (sub === "disable") {
            settings.enabled = false;
            save(db);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ Automod disabled")] });
        }
        
        if (sub === "punishment") {
            settings.punishment = interaction.options.getString("type");
            save(db);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#00FF00").setDescription(`✅ Punishment set to ${settings.punishment}`)] });
        }
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
