const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const fs = require("fs");

const cache = {
    roles: new Map(),
    channels: new Map()
};

module.exports = {

    data: new SlashCommandBuilder()
        .setName("backup")
        .setDescription("Ultimate Antinuke Backup System")

        .addSubcommand(cmd =>
            cmd.setName("create")
                .setDescription("Create server backup"))

        .addSubcommand(cmd =>
            cmd.setName("load")
                .setDescription("Load backup")
                .addStringOption(o =>
                    o.setName("id")
                        .setDescription("Backup ID")
                        .setRequired(true)))

        .addSubcommand(cmd =>
            cmd.setName("list")
                .setDescription("List backups"))

        .addSubcommand(cmd =>
            cmd.setName("load-all")
                .setDescription("Restore everything from backup")
                .addStringOption(o =>
                    o.setName("id")
                        .setDescription("Backup ID")
                        .setRequired(true)))

        .addSubcommand(cmd =>
            cmd.setName("delete")
                .setDescription("Delete backup")
                .addStringOption(o =>
                    o.setName("id")
                        .setDescription("Backup ID")
                        .setRequired(true)))

        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, args) {
        const isSlash = interaction.isChatInputCommand?.() || false;
        const guild = interaction.guild;

        if (!fs.existsSync("./data/backups"))
            fs.mkdirSync("./data/backups", { recursive: true });

        const sub = isSlash ? interaction.options.getSubcommand() : args[0]?.toLowerCase();


        // CREATE BACKUP
        if (sub === "create") {
            const statusMessage = await interaction.reply({ content: "⏳ **Initializing Structural DNA Extraction...**", fetchReply: true });
            const reply = (content) => isSlash ? interaction.editReply(content) : statusMessage.edit(content);

            const data = {
                id: `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                name: guild.name,
                guildId: guild.id,
                createdAt: new Date().toISOString(),
                roles: [],
                channels: []
            };

            // 1. Roles
            guild.roles.cache
                .filter(r => !r.managed && r.name !== "@everyone")
                .forEach(role => {
                    data.roles.push({
                        name: role.name,
                        color: role.color,
                        permissions: role.permissions.bitfield.toString(),
                        hoist: role.hoist,
                        position: role.position
                    });
                });

            // 2. Channels (Categories First)
            const categories = guild.channels.cache.filter(c => c.type === 4);
            categories.forEach(cat => {
                data.channels.push({
                    name: cat.name,
                    type: cat.type,
                    position: cat.position,
                    isCategory: true,
                    id: cat.id
                });
            });

            // 3. Channels (with parent mappings)
            guild.channels.cache
                .filter(c => c.type !== 4 && !c.isThread())
                .forEach(channel => {
                    data.channels.push({
                        name: channel.name,
                        type: channel.type,
                        position: channel.position,
                        parentId: channel.parentId,
                        topic: channel.topic || null
                    });
                });

            fs.writeFileSync(
                `./data/backups/${data.id}.json`,
                JSON.stringify(data, null, 2)
            );

            const embed = new EmbedBuilder()
                .setColor("#00FF7F")
                .setTitle("🛡️ Server DNA Secured")
                .setThumbnail(guild.iconURL())
                .setDescription(`The server structure has been successfully archived.\n\n> **Backup ID:** \`${data.id}\``)
                .addFields(
                    { name: "📊 STATS", value: `**Roles:** \`${data.roles.length}\`\n**Channels:** \`${data.channels.length}\``, inline: true },
                    { name: "📅 CREATED", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setFooter({ text: "interX • Backup System" });

            return reply({ content: null, embeds: [embed] });
        }


        // LIST
        if (sub === "list") {
            const files = fs.readdirSync("./data/backups").filter(f => f.endsWith(".json"));

            if (!files.length)
                return interaction.reply("📭 **No backups found in the vault.**");

            const list = files.map(f => {
                try {
                    const d = JSON.parse(fs.readFileSync(`./data/backups/${f}`));
                    return `> 🧬 \`${d.id || f.replace(".json", "")}\` — **${d.name || "Unknown"}**`;
                } catch (e) { return `> 🧬 \`${f}\` (Corrupt)`; }
            });

            const embed = new EmbedBuilder()
                .setColor("#8B0000")
                .setTitle("📂 Archive Vault")
                .setDescription(list.join("\n"))
                .setFooter({ text: `Total: ${files.length} backups` });

            return interaction.reply({ embeds: [embed] });
        }


        // DELETE
        if (sub === "delete") {
            const id = isSlash ? interaction.options.getString("id") : args[1];

            if (!id) return interaction.reply("⚠️ **Please provide a Backup ID.**");

            if (!fs.existsSync(`./data/backups/${id}.json`))
                return interaction.reply("❌ **Backup not found.**");

            fs.unlinkSync(`./data/backups/${id}.json`);
            return interaction.reply(`🗑️ **Backup \`${id}\` purged.**`);
        }


        // LOAD & LOAD-ALL (Unified restoration logic)
        if (sub === "load" || sub === "load-all") {
            const id = isSlash ? interaction.options.getString("id") : args[1];

            if (!id) return interaction.reply("⚠️ **Please provide a Backup ID.**");

            if (!fs.existsSync(`./data/backups/${id}.json`))
                return interaction.reply("❌ **Backup not found.**");

            const data = JSON.parse(fs.readFileSync(`./data/backups/${id}.json`));

            const warningMsg = await interaction.reply({ content: "⚠️ **WARNING:** This process will wipe all existing channels and roles. Starting in 5 seconds...", fetchReply: true });
            await new Promise(r => setTimeout(r, 5000));

            // 1. Wipe everything
            const channelsToDel = guild.channels.cache;
            for (const [id, ch] of channelsToDel) {
                await ch.delete().catch(() => { });
            }

            const rolesToDel = guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone");
            for (const [id, r] of rolesToDel) {
                await r.delete().catch(() => { });
            }

            // 2. Restore Roles
            const roleMap = new Map();
            for (const rData of data.roles) {
                const newRole = await guild.roles.create({
                    name: rData.name,
                    color: rData.color,
                    permissions: BigInt(rData.permissions),
                    hoist: rData.hoist
                }).catch(() => null);
                if (newRole) roleMap.set(rData.name, newRole);
            }

            // 3. Restore Categories
            const catMap = new Map();
            const categories = data.channels.filter(c => c.type === 4);
            for (const cat of categories) {
                const newCat = await guild.channels.create({
                    name: cat.name,
                    type: 4,
                    position: cat.position
                }).catch(() => null);
                if (newCat) catMap.set(cat.id, newCat.id);
            }

            // 4. Restore Channels
            const channels = data.channels.filter(c => c.type !== 4);
            for (const ch of channels) {
                await guild.channels.create({
                    name: ch.name,
                    type: ch.type,
                    position: ch.position,
                    parent: catMap.get(ch.parentId) || null,
                    topic: ch.topic
                }).catch(() => null);
            }

            return isSlash ? interaction.followUp("✅ **Protocol Complete.** DNA sequence successfully deployed.") : interaction.channel.send("✅ **Protocol Complete.** DNA sequence successfully deployed.");
        }

    },


    // CACHE SERVER
    cacheServer(guild) {

        guild.roles.cache.forEach(role => {

            if (role.name !== "@everyone") {

                cache.roles.set(role.id, {
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions.bitfield,
                    hoist: role.hoist
                });

            }

        });

        guild.channels.cache.forEach(channel => {

            cache.channels.set(channel.id, {
                name: channel.name,
                type: channel.type,
                parent: channel.parentId
            });

        });

    },


    // AUTO RESTORE CHANNEL
    channelDelete(channel) {

        const data = cache.channels.get(channel.id);
        if (!data) return;

        channel.guild.channels.create({
            name: data.name,
            type: data.type,
            parent: data.parent
        }).catch(() => { });

    },


    // AUTO RESTORE ROLE
    roleDelete(role) {

        const data = cache.roles.get(role.id);
        if (!data) return;

        role.guild.roles.create({
            name: data.name,
            color: data.color,
            permissions: data.permissions,
            hoist: data.hoist
        }).catch(() => { });

    }

};