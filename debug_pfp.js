const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log('Bot Tag:', client.user.tag);
    console.log('Avatar URL:', client.user.displayAvatarURL({ extension: 'png', size: 512 }));
    console.log('Avatar Hash:', client.user.avatar);
    process.exit(0);
});

client.login(process.env.TOKEN);
