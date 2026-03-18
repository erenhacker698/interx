const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/whitelist.json");

function load() {
    return JSON.parse(fs.readFileSync(filePath));
}

function save(data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("extraowner")
        .setDescription("Manage extra owners")
        .addSubcommand(cmd =>
            cmd.setName("add")
                .setDescription("Add extra owner")
                .addUserOption(opt =>
                    opt.setName("user").setDescription("User").setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("remove")
                .setDescription("Remove extra owner")
                .addUserOption(opt =>
                    opt.setName("user").setDescription("User").setRequired(true)))
        .addSubcommand(cmd =>
            cmd.setName("list")
                .setDescription("List extra owners")),

    async execute(interaction) {

        const data = load();
        const sub = interaction.options.getSubcommand();

        // 🔐 Only main owner can use
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: "❌ Only server owner can use this", ephemeral: true });
        }

        if (sub === "add") {
            const user = interaction.options.getUser("user");

            if (!data.users.includes(user.id)) {
                data.users.push(user.id);
                save(data);
            }

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("👑 Extra Owner Added")
                .setDescription(`${user.tag} is now protected`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "remove") {
            const user = interaction.options.getUser("user");

            data.users = data.users.filter(id => id !== user.id);
            save(data);

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("❌ Extra Owner Removed")
                .setDescription(`${user.tag} removed from whitelist`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        if (sub === "list") {

            const list = data.users.map(id => `<@${id}>`).join("\n") || "No extra owners";

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("📜 Extra Owners")
                .setDescription(list)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};