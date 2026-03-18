const { Client, GatewayIntentBits, ContainerBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    if (!channel) process.exit(1);

    try {
        console.log('Attempting V2 Container with ActionRow...');

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('b1').setLabel('Back').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('b2').setLabel('Exit').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('b3').setLabel('Next').setStyle(ButtonStyle.Secondary)
        );

        const select = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('s1')
                .setPlaceholder('Select Category')
                .addOptions([
                    { label: 'Home', value: 'home' },
                    { label: 'Security', value: 'security' }
                ])
        );

        const container = new ContainerBuilder()
            .addTextDisplayComponents({ type: 10, content: '## CV2 Help Menu' })
            .addActionRowComponents(select)
            .addSeparatorComponents({ type: 14 })
            .addActionRowComponents(buttons)
            .setAccentColor(0x5865F2);

        await channel.send({
            flags: 32768,
            components: [container]
        });
        console.log('Success!');
    } catch (e) {
        console.error('Failed:', e.message);
        if (e.rawError) console.error(JSON.stringify(e.rawError, null, 2));
    }
    process.exit(0);
});

client.login(process.env.TOKEN);
