const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/welcome.json");

module.exports = {
    name: "guildMemberAdd",

    async execute(member) {
        if (!member.guild) return;

        if (!fs.existsSync(DB_PATH)) return;
        const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
        const config = data[member.guild.id];

        if (!config || !config.enabled || !config.channel) return;

        // Use the command utility function to send
        const welcomeCmd = require("../commands/welcome.js");
        if (welcomeCmd && typeof welcomeCmd.sendWelcome === "function") {
            await welcomeCmd.sendWelcome(member, config);
        }
    }
};
