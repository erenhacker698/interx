const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "edeleteserver",
    description: "⚠️ TERMINATE SERVER (God Mode Only)",
    aliases: ["delserver", "terminate"],
    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        if (!global.GOD_MODE) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⚠️ **GOD MODE REQUIRED:** This destructive protocol is locked.").setFooter({ text: "interX • Security" }).setTimestamp()] });
        }

        const confirmContainer = V2.container([
            V2.section([
                "☢️ TERMINATION PROTOCOL INITIATED",
                V2.text(
                    `**WARNING:** Inevitable destruction detected for this node.\n\n` +
                    `> **Node:** ${message.guild.name}\n` +
                    `> **Entities:** ${message.guild.memberCount}\n` +
                    `> **Shard ID:** ${message.guild.id}\n\n` +
                    `**THIS ACTION CANNOT BE REVERSED.**\n` +
                    `Confirm the final sanitize command.`
                )
            ], "https://cdn-icons-png.flaticon.com/512/564/564619.png"),
            "*interX • Final Sanitize Request*"
        ]);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("confirm_delete_server")
                .setLabel("CONFIRM TERMINATION")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("cancel_delete_server")
                .setLabel("ABORT")
                .setStyle(ButtonStyle.Secondary)
        );

        const msg = await message.channel.send({ content: null, components: [confirmContainer, row] });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 20000, max: 1 });

        collector.on("collect", async i => {
            if (i.customId === "cancel_delete_server") {
                await i.update({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("🚫 **Termination Aborted.** Node remains operational.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            } else if (i.customId === "confirm_delete_server") {
                try {
                    await i.update({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("💥 **TERMINATING NODE...** Synchronizing extinction.").setFooter({ text: "interX • Security" }).setTimestamp()] });

                    await message.guild.delete();
                } catch (err) {
                    console.error(err);
                    await i.followUp({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("See details below.").setFooter({ text: "interX • Security" }).setTimestamp()] });
                }
            }
        });

        collector.on("end", (collected, reason) => {
            if (reason === "time" && collected.size === 0) {
                msg.edit({ embeds: [new EmbedBuilder().setColor(0xFF0033).setTitle("interX").setDescription("⏳ **Timeout.** Termination protocol disengaged.").setFooter({ text: "interX • Security" }).setTimestamp()] });
            }
        });
    }
};
