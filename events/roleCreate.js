const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = (client) => {

client.on("roleCreate", role => {

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("🎭 Role Created")
.setDescription(`Role: ${role}`)
.setTimestamp();

const log = role.guild.channels.cache.get(config.logChannel);
if(log) log.send({embeds:[embed]});

});

};