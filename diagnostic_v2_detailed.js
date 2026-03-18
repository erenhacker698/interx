const { Client, GatewayIntentBits } = require('discord.js');
const util = require('util');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    if (!channel) process.exit(1);

    try {
        console.log('Attempting V2 ServerInfo-style send...');
        await channel.send({
            flags: 32768,
            components: [
                {
                    type: 17, // Container
                    accent_color: 0xffffff,
                    components: [
                        {
                            type: 9, // Section
                            components: [{ type: 10, content: 'Header' }],
                            accessory: { type: 2, custom_id: 'x', label: '!', style: 2, disabled: true }
                        },
                        { type: 14 }, // Separator
                        { type: 10, content: 'Direct Text 1' },
                        { type: 10, content: 'Direct Text 2' }
                    ]
                }
            ]
        });
        console.log('Success!');
    } catch (e) {
        console.error('Failed:', e.message);
        if (e.rawError) {
            console.error('Raw Error Details:', util.inspect(e.rawError, { depth: null }));
        }
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
