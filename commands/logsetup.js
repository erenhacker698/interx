const { EmbedBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "logsetup",
    description: "Generate the interX log kernel infrastructure",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args, client) {
        const guild = message.guild;
        const msg = await message.reply("⚙️ **[ INITIALIZING_LOG_KERNEL ]** ... Establishing secure database path.");

        let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "interx log kernel");
        if (!category) {
            category = await guild.channels.create({
                name: "interX LOG KERNEL",
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }
                ]
            });
        }

        const logChannels = {
            message: "InterX-message",
            mod: "InterX-moderation",
            whitelist: "InterX-whitelist",
            security: "InterX-security",
            server: "InterX-server",
            role: "InterX-role",
            voice: "InterX-voice",
            member: "InterX-member",
            raid: "InterX-raid",
            spam: "InterX-spam",
            antinuke: "InterX-antinuke",
            ban: "InterX-ban",
            cmdspmban: "InterX-cmdspmban"
        };

        const LOGS_DB = path.join(__dirname, "../data/logs.json");
        let allLogs = {};
        if (fs.existsSync(LOGS_DB)) {
            try {
                allLogs = JSON.parse(fs.readFileSync(LOGS_DB, "utf8"));
            } catch (e) {
                allLogs = {};
            }
        }
        if (!allLogs[guild.id]) allLogs[guild.id] = {};

        const results = [];
        for (const [key, name] of Object.entries(logChannels)) {
            let ch = guild.channels.cache.find(c => c.name === name && c.parentId === category.id);
            if (!ch) {
                ch = await guild.channels.create({
                    name: name,
                    type: ChannelType.GuildText,
                    parent: category.id
                }).catch(() => null);
            }
            if (ch) {
                allLogs[guild.id][key] = ch.id;
                results.push(`✅ \`${name}\``);
            }
        }

        fs.writeFileSync(LOGS_DB, JSON.stringify(allLogs, null, 2));

        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("📁 LOG KERNEL OPERATIONAL")
            .setAuthor({ name: "interX • System Architecture", iconURL: client.user.displayAvatarURL() })
            .setDescription(
                "### **[ KERNEL_ESTABLISHED ]**\n> All secure logging sectors have been constructed and calibrated with the #FF0000 red theme.\n\n" +
                results.slice(0, 15).join("\n") + (results.length > 15 ? `\n> *... and ${results.length - 15} more channels.*` : "")
            )
            .setFooter({ text: "interX • Logging Protocol ACTIVE" })
            .setTimestamp();

        return msg.edit({ content: null, embeds: [embed] });
    }
};
