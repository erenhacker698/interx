const { EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB();
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/invitelogger.json");

module.exports = (client) => {

    client.on("guildMemberAdd", async member => {
        try {
            const guild = member.guild;
            if (!guild) return;

            const now = Date.now();
            const accountAge = now - member.user.createdTimestamp;
            const IS_FAKE = accountAge < 24 * 60 * 60 * 1000; // < 1 day

            // Fetch latest invites
            const newInvites = await guild.invites.fetch().catch(() => null);
            if (!newInvites) return;

            const oldInvites = client.invites.get(guild.id);
            if (!oldInvites) {
                client.invites.set(guild.id, newInvites);
                return;
            }

            const invite = newInvites.find(i => {
                const old = oldInvites.get(i.code);
                return old && i.uses > old.uses;
            });

            // Update cache
            client.invites.set(guild.id, newInvites);

            let inviter = null;
            let logChannelId = null;

            // Load invitelogger config
            if (fs.existsSync(DB_PATH)) {
                const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
                logChannelId = data[guild.id]?.channel;
            }

            if (invite && invite.inviter) {
                inviter = invite.inviter;

                // Don't count self-invites or bot invites
                if (inviter.id !== member.id && !member.user.bot) {
                    if (IS_FAKE) {
                        await db.add(`invites_${guild.id}_${inviter.id}.fake`, 1);
                    } else {
                        await db.add(`invites_${guild.id}_${inviter.id}.regular`, 1);
                        await db.set(`invited_by_${guild.id}_${member.id}`, inviter.id);
                    }
                }
            }

            // JOIN LOGGING (with red embed)
            if (logChannelId) {
                const channel = guild.channels.cache.get(logChannelId);
                if (channel) {
                    const regular = inviter ? await db.get(`invites_${guild.id}_${inviter.id}.regular`) || 0 : 0;
                    const bonus = inviter ? await db.get(`invites_${guild.id}_${inviter.id}.bonus`) || 0 : 0;
                    const leaves = inviter ? await db.get(`invites_${guild.id}_${inviter.id}.leaves`) || 0 : 0;
                    const fake = inviter ? await db.get(`invites_${guild.id}_${inviter.id}.fake`) || 0 : 0;
                    const total = (regular + bonus) - (leaves + fake);

                    const logEmbed = new EmbedBuilder()
                        .setColor("#df0000")
                        .setAuthor({ name: "NEW MEMBER JOINED", iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                        .setDescription(
                            `### 🛡️ JOIN AUTHENTICATION\n` +
                            `> **User:** ${member.user} (\`${member.id}\`)\n` +
                            `> **Invited By:** ${inviter ? `${inviter} (\`${inviter.id}\`)` : "`Unknown / Vanity / Bot`"}\n` +
                            `> **Current Invites:** \`${total < 0 ? 0 : total}\` total\n\n` +
                            `**ACCOUNT DETAILS**\n` +
                            `> **Age:** ${Math.floor(accountAge / (1000 * 60 * 60 * 24))} days old\n` +
                            `> **Fake:** ${IS_FAKE ? "🔴 `ALERT: NEW ACCOUNT`" : "🟢 `SECURE`"}`
                        )
                        .setFooter({ text: `Protocol: Sovereign Secure • ${guild.name}`, iconURL: client.user.displayAvatarURL() })
                        .setTimestamp();

                    channel.send({ embeds: [logEmbed] }).catch(() => {});
                }
            }

        } catch (e) {
            console.error(`[InviteTracker Error]: ${e.message}`);
        }
    });

    client.on("guildMemberRemove", async member => {
        try {
            const inviterId = await db.get(`invited_by_${member.guild.id}_${member.id}`);
            if (inviterId) {
                await db.add(`invites_${member.guild.id}_${inviterId}.leaves`, 1);
                await db.delete(`invited_by_${member.guild.id}_${member.id}`);
            }
        } catch (e) {
            console.error(`[InviteTracker Remove Error]: ${e.message}`);
        }
    });

    client.on("inviteCreate", async (invite) => {
        try {
            const guildInvites = await invite.guild.invites.fetch().catch(() => null);
            if (guildInvites) client.invites.set(invite.guild.id, guildInvites);
        } catch (e) {}
    });

    client.on("inviteDelete", async (invite) => {
        try {
            const guildInvites = await invite.guild.invites.fetch().catch(() => null);
            if (guildInvites) client.invites.set(invite.guild.id, guildInvites);
        } catch (e) {}
    });

};