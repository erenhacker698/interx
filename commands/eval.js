const { EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const { inspect } = require("util");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "eval",
    description: "Execute JavaScript code (Bot Owner only).",
    aliases: ["ev", "e"],
    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const code = args.join(" ");

        // GOD MODE TOGGLE (If no code is provided)
        if (!code) {
            global.GOD_MODE = !global.GOD_MODE;
            const status = global.GOD_MODE ? "ENABLED" : "DISABLED";
            const color = global.GOD_MODE ? "#e60000" : "#FF3030";

            const SYSTEM_DB = path.join(__dirname, "../data/system.json");
            try {
                if (!fs.existsSync(path.dirname(SYSTEM_DB))) fs.mkdirSync(path.dirname(SYSTEM_DB), { recursive: true });
                fs.writeFileSync(SYSTEM_DB, JSON.stringify({ GOD_MODE: global.GOD_MODE }, null, 2));
            } catch (e) { console.error("Failed to save system state:", e); }

            const godModeContainer = V2.container([
                V2.section([
                    V2.heading(`🚨 KERNEL OVERRIDE: ${status}`, 2),
                    V2.text(
                        `### **[ ROOT_ACCESS_${status} ]**\n` +
                        `System Level Protocols have been **${global.GOD_MODE ? "FULLY DEPLOYED" : "RESTRICTED"}**.\n\n` +
                        `> • **!ehelp** - Full God Mode Manifest\n` +
                        `> • **!elog** - Universal Log Stream\n` +
                        `> • **!enuke** - Protocol Alpha Access\n\n` +
                        `**Current Layer:** \`root@blueseal-kernel\``
                    )
                ], message.client.user.displayAvatarURL({ dynamic: true })),
                `*interX Security Matrix • Version Elite*`
            ], color);

            return message.reply({ content: null, components: [godModeContainer] });
        }

        // ACTUAL EVAL EXECUTION
        try {
            let evaled = eval(code);
            if (evaled instanceof Promise) evaled = await evaled;
            let output = typeof evaled !== "string" ? inspect(evaled, { depth: 0 }) : evaled;
            output = output.replace(new RegExp(message.client.token, "gi"), "[TOKEN]");
            if (output.length > 2000) output = output.slice(0, 1900) + "...";

            const resultContainer = V2.container([
                V2.section([
                    "💻 KERNEL EXECUTION: SUCCESS",
                    `\`\`\`js\n${output}\n\`\`\``
                ])
            ]);

            return message.channel.send({ content: null, components: [resultContainer] });
        } catch (err) {
            const errorContainer = V2.container([
                V2.section([
                    "⚠️ KERNEL EXECUTION: FAULT",
                    `\`\`\`js\n${err}\n\`\`\``
                ])
            ]);
            return message.channel.send({ content: null, components: [errorContainer] });
        }
    } };
