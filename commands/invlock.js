const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../data/invlock_config.json");

module.exports = {
    name: "stopinvlink",
    aliases: ["uninvlink", "invitelock"],
    description: "Lock or unlock the creation of server invite links.",
    permissions: [PermissionsBitField.Flags.Administrator],

    async execute(message, args, commandName) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: "⚠️ **[ ACCESS_DENIED ]** Administrator privileges required." });
        }

        let config = {};
        if (fs.existsSync(CONFIG_PATH)) {
            try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")); } catch (e) { }
        }

        const guildId = message.guild.id;
        const isStop = commandName === "stopinvlink";
        const isUnlock = commandName === "uninvlink";

        if (isStop) {
            config[guildId] = true;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

            // Delete ALL existing invites
            let deletedCount = 0;
            try {
                const invites = await message.guild.invites.fetch();
                for (const invite of invites.values()) {
                    await invite.delete("Security: stopinvlink protocol activated.");
                    deletedCount++;
                }
            } catch (err) {
                console.error("Invite Delete Error:", err);
            }

            const stopEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setAuthor({ name: "interX Sovereign Security", iconURL: message.client.user.displayAvatarURL() })
                .setTitle("🔒 [ INVITE_PROTOCOL_LOCKED ]")
                .setDescription(
                    `### **Server Lockdown Initialized**\n\n` +
                    `> **Status:** Invite Creation Disabled\n` +
                    `> **Invites Cleared:** Clear-sweep of \`${deletedCount}\` active links.\n\n` +
                    `**System Logic:**\n` +
                    `Any attempt to generate a new invite link will be instantly intercepted and terminated by the interX Sovereign Shield.`
                )
                .setFooter({ text: "interX Sovereign • Zero-Trust Invite Matrix" })
                .setTimestamp();

            return message.reply({ embeds: [stopEmbed] });
        }

        if (isUnlock) {
            config[guildId] = false;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

            const unlockEmbed = new EmbedBuilder()
                .setColor("#00FF00") // Green for unlock, though user asked for red theme mostly
                .setAuthor({ name: "interX Sovereign Security", iconURL: message.client.user.displayAvatarURL() })
                .setTitle("🔓 [ INVITE_PROTOCOL_RESTORED ]")
                .setDescription(
                    `### **Server Lockdown Lifted**\n\n` +
                    `> **Status:** Invite Creation Resumed\n` +
                    `> **Security:** Standard monitoring active.\n\n` +
                    `Users are now permitted to generate server invite links through standard Discord protocols.`
                )
                .setFooter({ text: "interX Sovereign • Access Protocols Nominal" })
                .setTimestamp();

            return message.reply({ embeds: [unlockEmbed] });
        }
    }
};
