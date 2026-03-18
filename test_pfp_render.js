const { Client, GatewayIntentBits, ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready - Testing PFP rendering');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    if (!channel) process.exit(1);

    const urls = [
        { label: 'Normal CDN', url: client.user.displayAvatarURL({ extension: 'png', size: 256 }) },
        { label: 'No Query', url: `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png` },
        { label: 'External', url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
    ];

    for (const item of urls) {
        try {
            console.log(`Testing URL: ${item.label}`);
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Render Test: ${item.label}`))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(item.url))
                )
                .setAccentColor(0x0099ff);

            await channel.send({
                flags: 32768,
                components: [container]
            });
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`Failed for ${item.label}:`, e.message);
        }
    }

    console.log('Test complete.');
    process.exit(0);
});

client.login(process.env.TOKEN);
