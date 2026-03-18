const Discord = require("discord.js");
require("./v2_shim");
const V2 = require("./utils/v2Utils");

// Mock guild and client
const guild = {
    members: {
        me: {
            displayAvatarURL: () => "https://example.com/avatar.png"
        }
    }
};
const client = {
    user: {
        displayAvatarURL: () => "https://example.com/avatar.png"
    }
};

try {
    const botAvatar = V2.botAvatar({ guild, client });
    console.log("botAvatar:", botAvatar);

    const mainSection = V2.section([
        V2.heading(`📂 TICKET #123`, 2),
        V2.text(`**Secure Channel Established.**`)
    ], botAvatar);
    console.log("mainSection created");

    const closeButton = new Discord.ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setEmoji("🔒").setStyle(Discord.ButtonStyle.Danger);
    const actionSection = V2.section([V2.text("Channel Controls:")], closeButton);
    console.log("actionSection created");

    const container = V2.container([mainSection, V2.separator(), actionSection]);
    console.log("container created");

    console.log("Container JSON:", JSON.stringify(container.toJSON(), null, 2));

} catch (err) {
    console.error("CRASHED:", err);
}
