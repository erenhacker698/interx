const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = (client) => {

client.on("messageUpdate", (oldMsg,newMsg)=>{

if(!oldMsg.guild) return;
if(oldMsg.content === newMsg.content) return;

const embed = new EmbedBuilder()
.setColor("#ff0000")
.setTitle("✏ Message Edited")
.addFields(
{ name:"User",value:`${oldMsg.author}`,inline:true},
{ name:"Old",value:oldMsg.content || "None"},
{ name:"New",value:newMsg.content || "None"}
)
.setTimestamp();

const channel = oldMsg.guild.channels.cache.get(config.logChannel);
if(channel) channel.send({embeds:[embed]});

});

};