const { PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "reactionroles.json");

function loadRR() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) { fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2)); return {}; }
    try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); } catch { return {}; }
}
function saveRR(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

module.exports = {
    name: "reactionrole",
    description: "Manage reaction role panels",
    usage: "!reactionrole <create|add|remove|list|delete>",
    permissions: [PermissionsBitField.Flags.ManageRoles],
    aliases: ["rr"],

    async execute(message, args) {
        const isOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID)) || message.guild.ownerId === message.author.id;
        if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
            return message.reply({ components: [V2.container(["🚫 You need **Manage Roles** permission."])] });

        const sub = args[0]?.toLowerCase();
        const data = loadRR();

        // ─── CREATE ───
        if (sub === "create") {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            const title = args.slice(2).join(" ") || "Self-Assign Roles";
            if (!channel) return message.reply({ components: [V2.container(["⚠️ **Usage:** `!reactionrole create #channel <title>`"])] });

            const panelMsg = await channel.send({
                embeds: [{
                    color: 0x5865F2,
                    title: `🎭 ${title}`,
                    description: "```diff\n+ ROLE ASSIGNMENT PANEL\n+ REACT TO CLAIM ROLES\n```\n\n**React to add a role — remove reaction to remove the role.**\n\n*No roles configured yet. Use `!reactionrole add` to add roles.*",
                    footer: { text: "interX • Reaction Roles" }
                }]
            });

            data[panelMsg.id] = { guildId: message.guild.id, channelId: channel.id, roles: [] };
            saveRR(data);

            return message.reply({
                components: [V2.container([
                    "✅ Reaction Role Panel Created",
                    `Panel created in ${channel}\n\n> **Message ID:** \`${panelMsg.id}\`\n> Use \`!reactionrole add ${panelMsg.id} <emoji> <@role>\` to add roles`
                ])]
            });
        }

        // ─── ADD ───
        if (sub === "add") {
            const [, messageId, emoji] = args;
            const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[3]);
            if (!messageId || !emoji || !role)
                return message.reply({ components: [V2.container(["⚠️ **Usage:** `!reactionrole add <messageID> <emoji> <@role>`"])] });
            if (!data[messageId]) return message.reply({ components: [V2.container(["❌ That message is not a reaction role panel."])] });
            if (data[messageId].roles.some(r => r.emoji === emoji))
                return message.reply({ components: [V2.container(["⚠️ That emoji is already assigned on this panel."])] });

            data[messageId].roles.push({ emoji, roleId: role.id });
            saveRR(data);

            try {
                const ch = message.guild.channels.cache.get(data[messageId].channelId);
                const pm = await ch.messages.fetch(messageId);
                await pm.react(emoji);
                const roleList = data[messageId].roles.map(r => `${r.emoji} — <@&${r.roleId}>`).join("\n");
                const old = pm.embeds[0];
                const { EmbedBuilder } = require("discord.js");
                await pm.edit({ embeds: [EmbedBuilder.from(old).setDescription(`\`\`\`diff\n+ ROLE ASSIGNMENT PANEL\n+ REACT TO CLAIM ROLES\n\`\`\`\n\n**React to add a role — remove to remove the role.**\n\n**Available Roles:**\n${roleList}`)] });
                return message.reply({ components: [V2.container([`✅ **${emoji} → ${role}** added to the panel.`])] });
            } catch (err) {
                return message.reply({ components: [V2.container(["❌ Failed to update the panel. Does the message still exist?"])] });
            }
        }

        // ─── REMOVE ───
        if (sub === "remove") {
            const [, messageId, emoji] = args;
            if (!messageId || !emoji) return message.reply({ components: [V2.container(["⚠️ **Usage:** `!reactionrole remove <messageID> <emoji>`"])] });
            if (!data[messageId]) return message.reply({ components: [V2.container(["❌ That message is not a reaction role panel."])] });

            const idx = data[messageId].roles.findIndex(r => r.emoji === emoji);
            if (idx === -1) return message.reply({ components: [V2.container(["⚠️ That emoji is not assigned on this panel."])] });

            data[messageId].roles.splice(idx, 1);
            saveRR(data);

            try {
                const ch = message.guild.channels.cache.get(data[messageId].channelId);
                const pm = await ch.messages.fetch(messageId);
                await pm.reactions.cache.get(emoji)?.remove();
                const roleList = data[messageId].roles.length > 0 ? data[messageId].roles.map(r => `${r.emoji} — <@&${r.roleId}>`).join("\n") : "*No roles configured yet.*";
                const { EmbedBuilder } = require("discord.js");
                await pm.edit({ embeds: [EmbedBuilder.from(pm.embeds[0]).setDescription(`\`\`\`diff\n+ ROLE ASSIGNMENT PANEL\n+ REACT TO CLAIM ROLES\n\`\`\`\n\n**React to add a role — remove to remove the role.**\n\n**Available Roles:**\n${roleList}`)] });
                return message.reply({ components: [V2.container([`✅ **${emoji}** removed from the panel.`])] });
            } catch { return message.reply({ components: [V2.container(["❌ Failed to update the panel."])] }); }
        }

        // ─── LIST ───
        if (sub === "list") {
            const panels = Object.entries(data).filter(([, p]) => p.guildId === message.guild.id);
            if (panels.length === 0) return message.reply({ components: [V2.container(["ℹ️ **No reaction role panels** found in this server."])] });
            const list = panels.map(([id, p]) => `> \`${id}\` — <#${p.channelId}> | **${p.roles.length} roles**`).join("\n");
            return message.reply({ components: [V2.container(["📋 Reaction Role Panels", V2.text(list)])] });
        }

        // ─── DELETE ───
        if (sub === "delete") {
            const messageId = args[1];
            if (!messageId) return message.reply({ components: [V2.container(["⚠️ **Usage:** `!reactionrole delete <messageID>`"])] });
            if (!data[messageId]) return message.reply({ components: [V2.container(["❌ That message is not a reaction role panel."])] });
            delete data[messageId];
            saveRR(data);
            return message.reply({ components: [V2.container(["✅ **Panel removed from database.** The message itself was not deleted."])] });
        }

        return message.reply({ components: [V2.container(["❓ **Unknown subcommand.**\nUse: `create`, `add`, `remove`, `list`, or `delete`"])] });
    }
};
