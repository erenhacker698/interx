const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: "invites",

    async execute(message) {

        const invites = await db.get(`invites_${message.guild.id}_${message.author.id}`) || 0;

        message.reply(`You invited **${invites}** members.`);
    }
};
