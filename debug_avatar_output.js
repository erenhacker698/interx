const V2 = require("./utils/v2Utils");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("ready", () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    // Mock a message object minimally
    const mockMessage = {
        client: client,
        guild: client.guilds.cache.first()
    };
    try {
        const url = V2.botAvatar(mockMessage);
        console.log(`V2.botAvatar returned: ${url}`);
    } catch (e) {
        console.error(`V2.botAvatar error: ${e.message}`);
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
