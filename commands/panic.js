const { EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "panic",
    description: "🚨 LOCKDOWN SERVER (Administrator Only)",
    aliases: ["lockdown", "emergency"],
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("🚫 **Authorized Personnel Only.**");
        }

        const mode = args[0]?.toLowerCase();
        const guild = message.guild;
        const channels = Array.from(guild.channels.cache.filter(c => c.type === ChannelType.GuildText).values());

        if (mode === "on" || mode === "start") {
            const processingMsg = await message.reply("🚨 **INITIATING LOCKDOWN...** Processing channels...");

            // TURBO LOCKDOWN (PARALLEL)
            const lockdownTasks = channels.map(channel => {
                return channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false,
                    AddReactions: false
                }, { reason: "🚨 EMERGENCY PANIC MODE" }); // Implicitly returns a Promise
            });

            const results = await Promise.allSettled(lockdownTasks);
            const lockedCount = results.filter(r => r.status === "fulfilled").length;

            try {
                await guild.setVerificationLevel(3); // High
            } catch (e) { }

            const { AttachmentBuilder } = require("discord.js");
            const panicIcon = new AttachmentBuilder("./photos/panic_on.png", { name: "panic_on.png" });

            const container = V2.container([
                V2.section(
                    [
                        "🚨 SERVER LOCKDOWN ACTIVE",
                        V2.text(
                            `### **[ PANIC_MODE_ENGAGED ]**\n\n` +
                            `🛡️ **Status:** \`RESTRICTED ACCESS\`\n` +
                            `🔒 **Channels Locked:** \`${lockedCount}\`\n` +
                            `⚖️ **Verification:** \`HIGH\`\n\n` +
                            `*All text transmission and reaction vectors have been neutralized. Await further instructions from administration.*`
                        )
                    ],
                    "attachment://panic_on.png"
                ),
                "*interX • Emergency Protocol Active*"
            ]);

            await processingMsg.delete().catch(() => { });
            return message.channel.send({ content: null, files: [panicIcon], components: [container] });
        }

        if (mode === "off" || mode === "end") {
            const processingMsg = await message.reply("🟢 **LIFTING LOCKDOWN...** Restoring channels...");

            // TURBO UNLOCK (PARALLEL)
            const unlockTasks = channels.map(channel => {
                return channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: null,
                    AddReactions: null
                }, { reason: "🟢 SYSTEM NORMALIZED" });
            });

            const results = await Promise.allSettled(unlockTasks);
            const unlockedCount = results.filter(r => r.status === "fulfilled").length;

            const { AttachmentBuilder } = require("discord.js");
            const liftIcon = new AttachmentBuilder("./photos/panic_off.png", { name: "panic_off.png" });

            const container = V2.container([
                V2.section(
                    [
                        "✅ LOCKDOWN LIFTED",
                        V2.text(
                            `### **[ SYSTEM_NORMALIZED ]**\n\n` +
                            `🟢 **Status:** \`OPERATIONAL\`\n` +
                            `🔓 **Channels Restored:** \`${unlockedCount}\`\n\n` +
                            `*Panic mode has been disengaged. All communication channels are now functional.*`
                        )
                    ],
                    "attachment://panic_off.png"
                ),
                "*interX • Security Baseline Restored*"
            ], require("../config").V2_BLUE);

            await processingMsg.delete().catch(() => { });
            return message.channel.send({ content: null, files: [liftIcon], components: [container] });
        }

        return message.reply("Usage: `!panic on` (Lockdown) or `!panic off` (Lift)");
    }
};
