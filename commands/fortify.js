const { PermissionsBitField, EmbedBuilder, ChannelType } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "fortify",
    description: "🔒 FORTIFY SERVER (Maximum Security Lockdown)",
    aliases: ["secure", "fmode"],
    usage: "!fortify <on | off>",
    permissions: [PermissionsBitField.Flags.Administrator],
    whitelistOnly: true,

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner) {
            return message.reply({ components: [V2.container(["🚫 **Access Denied:** Only the **Architect** or **Server Owner** can initiate the Fortification Protocol."])] });
        }

        const mode = args[0]?.toLowerCase();
        const guild = message.guild;

        if (mode === "on" || mode === "start") {
            const processingMsg = await message.reply({ components: [V2.container(["🛡️ **INITIATING SERVER FORTIFICATION...**\nHardenining channel perimeters and asset vectors..."])] });

            try {
                // 1. Max Verification Level (Highest)
                await guild.setVerificationLevel(4).catch(() => {});

                // 2. Global Channel Hardening
                const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
                const hardenTasks = channels.map(channel => {
                    return channel.permissionOverwrites.edit(guild.roles.everyone, {
                        MentionEveryone: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false,
                        SendMessagesInThreads: false,
                        UseExternalEmojis: false,
                        UseExternalStickers: false
                    }, { reason: "🛡️ FORTIFICATION_PROTOCOL_ACTIVE" }).catch(() => {});
                });

                await Promise.allSettled(hardenTasks);

                // 3. Disable Nickname Changes
                await guild.roles.everyone.setPermissions(guild.roles.everyone.permissions.remove(PermissionsBitField.Flags.ChangeNickname)).catch(() => {});

                const fortifyOn = V2.container([
                    V2.section([
                        "🛡️ SERVER FORTIFIED: MAXIMUM_SECURITY",
                        `### **[ DEFENSIVE_STATE: ACTIVE ]**\n\n` +
                        `> **Verification:** \`VERY HIGH\` (Level 4)\n` +
                        `> **Threads/Mentions:** \`TERMINATED\`\n` +
                        `> **Perimeter:** \`LOCKED\`\n\n` +
                        `*The node is now operating under a Maximum Security Directive. All non-standard communication vectors have been neutralized.*`
                    ], V2.botAvatar(message)),
                    V2.separator(),
                    "*interX • Sovereign Fortification System*"
                ], "#8B0000"); // Dark Red

                await processingMsg.delete().catch(() => {});
                return message.channel.send({ content: null, components: [fortifyOn] });

            } catch (err) {
                console.error(err);
                return message.channel.send({ components: [V2.container(["❌ **FATAL_ERROR:** Fortification protocol failed to stabilize."])] });
            }
        }

        if (mode === "off" || mode === "stop") {
            const processingMsg = await message.reply({ components: [V2.container(["🟢 **DISSIPATING FORTIFICATION...**\nRestoring standard operational baseline..."])] });

            try {
                // 1. Restore Verification Level (Medium or High)
                await guild.setVerificationLevel(2).catch(() => {});

                // 2. Restore Global Permissions (Reset overwrites for Everyone)
                const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
                const restoreTasks = channels.map(channel => {
                    return channel.permissionOverwrites.edit(guild.roles.everyone, {
                        MentionEveryone: null,
                        CreatePublicThreads: null,
                        CreatePrivateThreads: null,
                        SendMessagesInThreads: null,
                        UseExternalEmojis: null,
                        UseExternalStickers: null
                    }, { reason: "🟢 FORTIFICATION_PROTOCOL_OFF" }).catch(() => {});
                });

                await Promise.allSettled(restoreTasks);

                // 3. Re-enable Nickname Changes
                await guild.roles.everyone.setPermissions(guild.roles.everyone.permissions.add(PermissionsBitField.Flags.ChangeNickname)).catch(() => {});

                const fortifyOff = V2.container([
                    V2.section([
                        "✅ FORTIFICATION DISSIPATED",
                        `### **[ DEFENSIVE_STATE: STANDBY ]**\n\n` +
                        `> **Verification:** \`MEDIUM\`\n` +
                        `> **Perimeter:** \`STABLE\`\n\n` +
                        `*Standard operations have been restored to the node. Security shields are now in Standby Mode.*`
                    ], V2.botAvatar(message)),
                    V2.separator(),
                    "*interX • Sovereignty Restored*"
                ], "#00FF00"); // Green for normalization

                await processingMsg.delete().catch(() => {});
                return message.channel.send({ content: null, components: [fortifyOff] });

            } catch (err) {
                console.error(err);
                return message.channel.send({ components: [V2.container(["❌ **SYSTEM_FAULT:** Manual normalization required for some sectors."])] });
            }
        }

        return message.reply({ components: [V2.container(["**Sovereign Fortification Protocol**\n\n> `!fortify on` — Enter Maximum Security State\n> `!fortify off` — Restore Baseline Status"])] });
    }
};
