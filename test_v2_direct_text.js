const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    if (!channel) process.exit(1);

    try {
        console.log('Attempting V2 RAW send (Container with ONLY direct TextDisplay)...');
        await channel.send({
            flags: 32768,
            components: [
                {
                    type: 17, // Container
                    accent_color: 0xffffff,
                    components: [
                        { type: 10, content: 'Direct Line 1' },
                        { type: 10, content: 'Direct Line 2' }
                    ]
                }
            ]
        });
        console.log('Success!');
    } catch (e) {
        console.error('Failed:', e.message);
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
