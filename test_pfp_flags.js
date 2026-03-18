const { Client, GatewayIntentBits, ContainerBuilder, SectionBuilder, TextDisplayBuilder, ThumbnailBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready - Testing PFP flags');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    if (!channel) {
        console.error('No suitable channel found');
        process.exit(1);
    }

    const pfp = client.user.displayAvatarURL({ extension: 'png', size: 256 });
    console.log('Testing PFP:', pfp);

    const flagsToTest = [
        { label: '32768 (1<<15)', val: 32768 },
        { label: '65536 (1<<16)', val: 65536 },
        { label: '524288 (1<<19)', val: 524288 },
        { label: '557056 (1<<15|1<<19)', val: 557056 }
    ];

    for (const flag of flagsToTest) {
        try {
            console.log(`Sending with flag: ${flag.label}`);
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Flag Test: ${flag.label}`))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(pfp))
                )
                .setAccentColor(0x0099ff);

            await channel.send({
                content: `Testing V2 Flag: **${flag.label}**`,
                flags: flag.val,
                components: [container]
            });
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`Failed for ${flag.label}:`, e.message);
        }
    }

    console.log('Test sequence complete.');
    process.exit(0);
});

client.login(process.env.TOKEN);
