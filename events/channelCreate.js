const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = (client) => {

client.on("channelCreate", channel => {

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("📁 Channel Created")
.setDescription(`Channel: ${channel}`)
.setTimestamp();

const log = channel.guild.channels.cache.get(config.logChannel);
if(log) log.send({embeds:[embed]});

});

};