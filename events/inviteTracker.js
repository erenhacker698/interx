const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const config = require("../config.json");

module.exports = (client) => {

    client.on("guildMemberAdd", async member => {

        const newInvites = await member.guild.invites.fetch();
        const oldInvites = client.invites.get(member.guild.id);

        const invite = newInvites.find(i => i.uses > oldInvites.get(i.code)?.uses);

        client.invites.set(member.guild.id, newInvites);

        let inviter = "Unknown";

        if (invite) {
            inviter = invite.inviter;

            await db.add(`invites_${member.guild.id}_${inviter.id}`, 1);
        }

        const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Member Joined")
            .setDescription(`
User: ${member}
Invited By: ${inviter}
Invite Code: ${invite?.code || "Unknown"}
Uses: ${invite?.uses || "Unknown"}
`)
            .setTimestamp();

        const channel = member.guild.channels.cache.get(config.logChannel);
        if (channel) channel.send({ embeds: [embed] });

    });

};