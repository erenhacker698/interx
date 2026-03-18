const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = (client) => {

client.on("messageDelete", async message => {

if(!message.guild) return;

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("🗑 Message Deleted")
.addFields(
{ name: "User", value: `${message.author}`, inline: true },
{ name: "Channel", value: `${message.channel}`, inline: true },
{ name: "Content", value: message.content || "None" }
)
.setTimestamp();

const channel = message.guild.channels.cache.get(config.logChannel);
if(channel) channel.send({ embeds:[embed] });

});

};