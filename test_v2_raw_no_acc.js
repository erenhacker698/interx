const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    if (!channel) process.exit(1);

    try {
        console.log('Attempting V2 RAW send (Section with NO accessory)...');
        await channel.send({
            flags: 32768,
            components: [
                {
                    type: 17, // Container
                    accent_color: 0xff0000,
                    components: [
                        {
                            type: 9, // Section
                            components: [
                                { type: 10, content: 'Section 1 (No Accessory)' }
                            ]
                        },
                        {
                            type: 14 // Separator
                        },
                        {
                            type: 10, // TextDisplay
                            content: 'Direct Container Text'
                        }
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
