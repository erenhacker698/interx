const { EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID, EMBED_COLOR, ERROR_COLOR } = require("../config");

module.exports = {
    name: "vmoveall",
    description: "Move all members from one voice channel to another",
    usage: "!vmoveall <from_channel_id> <to_channel_id>",
    aliases: ["moveall", "massmove"],
    permissions: [PermissionsBitField.Flags.MoveMembers],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(ERROR_COLOR).setDescription("🚫 You do not have permission to move members.")] });
        }

        if (args.length < 2) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(require("../config").WARN_COLOR).setDescription("⚠️ **Usage:** `!vmoveall <FromChannelID> <ToChannelID>`")] });
        }

        const fromId = args[0].replace(/[<#>]/g, "");
        const toId = args[1].replace(/[<#>]/g, "");

        const fromChannel = message.guild.channels.cache.get(fromId);
        const toChannel = message.guild.channels.cache.get(toId);

        if (!fromChannel || fromChannel.type !== ChannelType.GuildVoice) {
            return message.reply("❌ **Invalid Source Channel.** Please provide a valid Voice Channel ID.");
        }
        if (!toChannel || toChannel.type !== ChannelType.GuildVoice) {
            return message.reply("❌ **Invalid Destination Channel.** Please provide a valid Voice Channel ID.");
        }

        if (fromChannel.members.size === 0) {
            return message.reply("⚠️ **Source Channel is empty.** No one to move.");
        }

        const count = fromChannel.members.size;
        let moved = 0;

        const loadingMsg = await message.reply({
            content: null,
            embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("🔄 MASS VOICE TRANSFER").setDescription(`Relocating **${count}** members...`).setFooter({ text: "interX • Security" }).setTimestamp()]
        });

        // Parallel Move
        await Promise.all(Array.from(fromChannel.members.values()).map(async (member) => {
            try {
                await member.voice.setChannel(toChannel, "Mass Move Protocol");
                moved++;
            } catch (err) { }
        }));

        const container = V2.container([
            V2.section([
                "🔄 MASS VOICE TRANSFER",
                `Successfully relocated **${moved}/${count}** members.`
            ], "https://cdn-icons-png.flaticon.com/512/3135/3135882.png"),
            "📂 ROUTING",
            `> **From:** ${fromChannel.name}\n> **To:** ${toChannel.name}`,
            `> **Authorized By:** ${message.author}`,
            "*interX • Logistics Protocol*"
        ]);

        await loadingMsg.edit({ content: null, components: [container] });
    }
};
