const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { isBypass } = require("../utils/bypass_system.js");

const DB_PATH = path.join(__dirname, "../data/welcome.json");

function loadData() {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch { return {}; }
}

function saveData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function parseVariables(text, member) {
    if (!text) return "";
    return text
        .replace(/{user}/g, `<@${member.user.id}>`)
        .replace(/{mention}/g, `<@${member.user.id}>`)
        .replace(/{tag}/g, member.user.tag)
        .replace(/{name}/g, member.user.username)
        .replace(/{id}/g, member.user.id)
        .replace(/{server}/g, member.guild.name)
        .replace(/{membercount}/g, member.guild.memberCount.toString());
}

module.exports = {
    name: "welcome",
    description: "Ultra-Premium Mimu-style welcome system with variables.",
    aliases: ["wlc", "welc"],

    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Configure the welcome system")
        .addSubcommand(s => s.setName("on").setDescription("Enable welcome system"))
        .addSubcommand(s => s.setName("off").setDescription("Disable welcome system"))
        .addSubcommand(s => s.setName("channel").setDescription("Set the welcome channel").addChannelOption(o => o.setName("channel").setDescription("Target channel").setRequired(true)))
        .addSubcommand(s => s.setName("message").setDescription("Set the welcome message").addStringOption(o => o.setName("text").setDescription("The message text (supports {user}, {server}, etc)").setRequired(true)))
        .addSubcommand(s => s.setName("title").setDescription("Set the embed title").addStringOption(o => o.setName("text").setDescription("The title text").setRequired(true)))
        .addSubcommand(s => s.setName("description").setDescription("Set the embed description").addStringOption(o => o.setName("text").setDescription("The description text").setRequired(true)))
        .addSubcommand(s => s.setName("image").setDescription("Set the welcome image URL").addStringOption(o => o.setName("url").setDescription("The image/gif URL").setRequired(true)))
        .addSubcommand(s => s.setName("color").setDescription("Set the embed color").addStringOption(o => o.setName("hex").setDescription("Hex color code (e.g. #df0000)").setRequired(true)))
        .addSubcommand(s => s.setName("test").setDescription("Preview the welcome message")),

    async execute(message, args) {
        const guild = message.guild;
        const sub = (message.options?.getSubcommand?.() || args[0]?.toLowerCase());

        // 🛡️ PERM CHECK
        if (!isBypass(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply("❌ **[ ERROR ]** You lack `Manage_Guild` authority.");
        }

        const data = loadData();
        if (!data[guild.id]) data[guild.id] = { enabled: false, channel: null, message: "{user} joined **{server}**!", embed: { title: "New Member Detected", description: "Welcome to the server!", color: "#df0000", image: null } };
        const g = data[guild.id];

        if (!sub || sub === "help") {
            const help = new EmbedBuilder()
                .setColor("#df0000")
                .setTitle("🏷️ [ WELCOME_SYSTEM_PROTOCOLS ]")
                .setDescription(
                    "### **Configuration Commands**\n" +
                    "> `!welcome channel #ch` — Set landing sector\n" +
                    "> `!welcome message <text>` — Set join text\n" +
                    "> `!welcome title <text>` — Set embed title\n" +
                    "> `!welcome description <text>` — Set embed desc\n" +
                    "> `!welcome image <url>` — Set visual gif/img\n" +
                    "> `!welcome on / off` — Toggle activation\n" +
                    "> `!welcome test` — Simulate join visual\n\n" +
                    "### **Available Variables**\n" +
                    "`{user}`, `{mention}`, `{tag}`, `{server}`, `{membercount}`"
                )
                .setFooter({ text: "interX • Mimu-Style Intelligence" });
            return message.reply({ embeds: [help] });
        }

        const input = (message.options?.getString?.("text") || message.options?.getString?.("url") || message.options?.getString?.("hex") || args.slice(1).join(" "));

        switch (sub) {
            case "on":
                if (!g.channel) return message.reply("❌ **[ ERROR ]** Establish a landing channel first (`!welcome channel #channel`).");
                g.enabled = true;
                break;
            case "off":
                g.enabled = false;
                break;
            case "channel":
                const channel = message.mentions.channels.first() || guild.channels.cache.get(args[1]) || message.options?.getChannel?.("channel");
                if (!channel) return message.reply("❌ **[ ERROR ]** Specify a valid text channel.");
                g.channel = channel.id;
                message.reply(`✅ **Landing sector aligned:** ${channel}`);
                break;
            case "message":
                if (!input) return message.reply("❌ **[ ERROR ]** Specify message text.");
                g.message = input;
                break;
            case "title":
                if (!input) return message.reply("❌ **[ ERROR ]** Specify title text.");
                g.embed.title = input;
                break;
            case "description":
                if (!input) return message.reply("❌ **[ ERROR ]** Specify description text.");
                g.embed.description = input;
                break;
            case "image":
                if (!input || !input.startsWith("http")) return message.reply("❌ **[ ERROR ]** Specify a valid URL.");
                g.embed.image = input;
                break;
            case "color":
                if (!input || !input.startsWith("#")) return message.reply("❌ **[ ERROR ]** Specify a valid Hex code (e.g. `#df0000`).");
                g.embed.color = input;
                break;
            case "test":
                return this.sendWelcome(message.member, g, message.channel);
        }

        saveData(data);
        if (sub !== "test" && sub !== "channel") message.reply(`✅ **Protocol Updated:** \`${sub}\` modification secured.`);
    },

    async sendWelcome(member, config, channelOverride = null) {
        if (!config || !config.channel) return;
        const channel = channelOverride || member.guild.channels.cache.get(config.channel);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(config.embed.color || "#df0000")
            .setTitle(parseVariables(config.embed.title, member))
            .setDescription(parseVariables(config.embed.description, member))
            .setTimestamp()
            .setThumbnail(member.user.displayAvatarURL());

        if (config.embed.image) embed.setImage(config.embed.image);

        return channel.send({
            content: parseVariables(config.message, member),
            embeds: [embed]
        }).catch(() => { });
    }
};
