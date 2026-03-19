const { EmbedBuilder, PermissionsBitField, ChannelType, AuditLogEvent, SlashCommandBuilder } = require("discord.js");
const { isBypass } = require("../utils/bypass_system.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/jail_config.json");

function loadConfig() {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveConfig(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Ensure the jail system is fully setup with roles and channels
async function setupJail(guild) {
    let jailRole = guild.roles.cache.find(r => r.name.toLowerCase() === "jail");
    if (!jailRole) {
        jailRole = await guild.roles.create({
            name: "Jail",
            color: "#010101",
            reason: "interX Jail System Role"
        }).catch(err => console.log(err));
    }

    // Attempt to hide ALL existing channels dynamically if they aren't hidden
    // Note: To avoid rate-limiting issues on huge servers, this runs async in the background
    guild.channels.cache.forEach((ch) => {
        if (ch.parentId && (ch.parent && ch.parent.name.toLowerCase() === "jail")) return;
        try {
            if (ch.manageable) {
                ch.permissionOverwrites.edit(jailRole, {
                    ViewChannel: false,
                    SendMessages: false,
                    Connect: false
                }).catch(() => {});
            }
        } catch (e) {}
    });

    // Create Category if not exists
    let jailCategory = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === "Jail");
    if (!jailCategory) {
        jailCategory = await guild.channels.create({
            name: "Jail",
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, 
                { id: jailRole.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        }).catch(() => null);
    }

    // Create Text Channel
    let jailChat = guild.channels.cache.find(c => c.name.toLowerCase() === "jail-chat" && c.parentId === jailCategory?.id);
    if (!jailChat && jailCategory) {
        jailChat = await guild.channels.create({
            name: "jail-chat",
            type: ChannelType.GuildText,
            parent: jailCategory.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: jailRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        }).catch(() => null);
    }

    // Create Voice Channel
    let jailVoice = guild.channels.cache.find(c => c.name.toLowerCase() === "jail vc" && c.parentId === jailCategory?.id);
    if (!jailVoice && jailCategory) {
        jailVoice = await guild.channels.create({
            name: "Jail VC",
            type: ChannelType.GuildVoice,
            parent: jailCategory.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: jailRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak] },
                { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect] }
            ]
        }).catch(() => null);
    }

    return { jailRole, jailCategory, jailChat, jailVoice };
}

async function arrestUser(guild, userId, reason, client) {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(()=>null);
    if (!member) return;

    // Protection: don't arrest Bot Dev, Owner, or the Bot itself
    if (isBypass(userId) || userId === guild.ownerId || userId === client.user.id) return;

    const { jailRole, jailChat } = await setupJail(guild);
    if (!jailRole) return;

    // Remove all roles possible
    const botHighest = guild.members.me.roles.highest;
    const removableRoles = member.roles.cache.filter(r => r.id !== guild.id && r.position < botHighest.position);
    await member.roles.remove(removableRoles).catch(() => {});
    
    // Assign Jail Role
    await member.roles.add(jailRole).catch(() => {});

    // Premium Red Alert Embed
    const embed = new EmbedBuilder()
        .setColor("#FF1A1A")
        .setAuthor({ name: "interX • Security Restraining Protocol", iconURL: guild.iconURL() || client.user.displayAvatarURL() })
        .setTitle("🚨 YOU HAVE BEEN QUARANTINED [ JAILED ]")
        .setDescription(
            `**<@${userId}>**, you triggered a maximum security violation and have been instantly forcefully locked down.\n\n` +
            `> **Violation Trigger:** \`${reason}\`\n\n` +
            `All your previous roles have been stripped. All channels have been locked. You are now restricted solely to this jail block. Wait for administrative judgment.`
        )
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1063/1063196.png")
        .setImage("https://media.discordapp.net/attachments/1462030670250381520/1467468087048667360/228552bb6bdd183da62941c007097034_2-1.gif?ex=69b5e268&is=69b490e8&hm=cc22146d176f1c2a49341d9c2e011fef48eac6faf61126c98818a75c3a7f6231&=")
        .setFooter({ text: "interX System Authority • Maximum Security Enforcement", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    if (jailChat) {
        jailChat.send({ content: `<@${userId}> ||<@${guild.ownerId}>||`, embeds: [embed] }).catch(() => {});
    }
}

// Anti Duplicate event listeners tracker
let eventsAttached = false;

module.exports = {
    name: "jail",
    description: "Manage the Quarantine / Jail Trap protocol.",
    permissions: [PermissionsBitField.Flags.Administrator],

    data: new SlashCommandBuilder()
        .setName("jail")
        .setDescription("Manage the jail automation system")
        .addSubcommand(s => s.setName("enable").setDescription("Enable the automatic jail trap"))
        .addSubcommand(s => s.setName("disable").setDescription("Disable the automatic jail trap"))
        .addSubcommand(s => s.setName("setup").setDescription("Generate the jail channels manually")),

    // Prefix Handler
    async execute(message, args, client) {
        this.attachEvents(client);

        if (args[0] === "setup") {
            const msg = await message.reply("⚙️ Constructing Jail layout...");
            await setupJail(message.guild);
            return msg.edit("✅ Jail structural format built dynamically!");
        }

        const config = loadConfig();
        const guildId = message.guild.id;

        if (args[0] === "enable") {
            config[guildId] = { enabled: true };
            saveConfig(config);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#00FF00").setTitle("🚨 Jail Trap Activated").setDescription("The trap is set! Anyone touching the server name, channels, or roles will be instantly thrown into `#jail-chat`.")] });
        }

        if (args[0] === "disable") {
            config[guildId] = { enabled: false };
            saveConfig(config);
            return message.reply({ embeds: [new EmbedBuilder().setColor("#FF0000").setTitle("❌ Jail Trap Deactivated").setDescription("Automated jailing has been paused.")] });
        }

        return message.reply({ embeds: [new EmbedBuilder().setColor("#2B2D31").setDescription("Usage: `!jail setup`, `!jail enable`, `!jail disable`\n*(Type !jail enable to start automatically arresting structural griefers!)*")] });
    },

    // Slash Handler
    async slashExecute(interaction, client) {
        this.attachEvents(client);
        
        const sub = interaction.options.getSubcommand();
        const config = loadConfig();
        const guildId = interaction.guild.id;

        if (sub === "setup") {
            await interaction.reply("⚙️ Constructing Jail layout...");
            await setupJail(interaction.guild);
            return interaction.editReply("✅ Jail structural format built dynamically!");
        }

        if (sub === "enable") {
            config[guildId] = { enabled: true };
            saveConfig(config);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#00FF00").setTitle("🚨 Jail Trap Activated").setDescription("The trap is set! Anyone touching the structural integrity will be jailed.")] });
        }

        if (sub === "disable") {
            config[guildId] = { enabled: false };
            saveConfig(config);
            return interaction.reply({ embeds: [new EmbedBuilder().setColor("#FF0000").setTitle("❌ Jail Trap Deactivated")] });
        }
    },

    // Attach Trap Events
    attachEvents(client) {
        if (eventsAttached) return;
        eventsAttached = true;
        
        console.log("🔒 [Jail Trap] Sentinels Activated");

        // EVENT: SERVER NAME CHANGE
        client.on("guildUpdate", async (oldGuild, newGuild) => {
            if (oldGuild.name === newGuild.name) return;
            const config = loadConfig();
            if (!config[newGuild.id]?.enabled) return;

            setTimeout(async () => {
                const logs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 }).catch(()=>null);
                if (!logs) return;
                const entry = logs.entries.first();
                if (!entry || (Date.now() - entry.createdTimestamp > 15000)) return;
                
                await arrestUser(newGuild, entry.executor.id, "Unauthorized Server Title Mutation", client);
            }, 1000);
        });

        // EVENT: CHANNEL DELETE
        client.on("channelDelete", async (channel) => {
            if (!channel.guild) return;
            const config = loadConfig();
            if (!config[channel.guild.id]?.enabled) return;

            setTimeout(async () => {
                const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(()=>null);
                if (!logs) return;
                const entry = logs.entries.first();
                if (!entry || entry.executor.id === client.user.id || (Date.now() - entry.createdTimestamp > 15000)) return;
                
                await arrestUser(channel.guild, entry.executor.id, `Unauthorized Channel Extermination`, client);
            }, 1000);
        });

        // EVENT: ROLE DELETE
        client.on("roleDelete", async (role) => {
            if (!role.guild) return;
            const config = loadConfig();
            if (!config[role.guild.id]?.enabled) return;

            setTimeout(async () => {
                const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(()=>null);
                if (!logs) return;
                const entry = logs.entries.first();
                if (!entry || entry.executor.id === client.user.id || (Date.now() - entry.createdTimestamp > 15000)) return;
                
                await arrestUser(role.guild, entry.executor.id, `Unauthorized Role Deletion`, client);
            }, 1000);
        });

        // EVENT: GIVING ROLE
        client.on("guildMemberUpdate", async (oldMember, newMember) => {
            if (!newMember.guild) return;
            const config = loadConfig();
            if (!config[newMember.guild.id]?.enabled) return;

            if (oldMember.roles.cache.size >= newMember.roles.cache.size) return;

            setTimeout(async () => {
                const logs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 }).catch(()=>null);
                if (!logs) return;
                const entry = logs.entries.first();
                if (!entry || entry.executor.id === client.user.id || (Date.now() - entry.createdTimestamp > 15000)) return;
                
                await arrestUser(newMember.guild, entry.executor.id, `Unauthorized Distribution of Roles to <@${newMember.id}>`, client);
            }, 1000);
        });
    }
};
