const { Client, GatewayIntentBits, ContainerBuilder, SectionBuilder, TextDisplayBuilder, SeparatorBuilder, ThumbnailBuilder } = require('discord.js');
const util = require('util');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log('Bot ready');
    const channel = client.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
    const guild = channel.guild;

    try {
        console.log('Testing exact serverinfo components...');

        // Mocking the values as they appear in serverinfo.js
        const ownerTag = "gt4realz_";
        const createdFull = `<t:${Math.floor(Date.now() / 1000)}:F>`;
        const boostLevel = 0;
        const boostCount = 0;

        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`## 📊 ${guild.name.toUpperCase()}`),
                        new TextDisplayBuilder().setContent(`**ID:** \`${guild.id}\``)
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild.iconURL({ forceStatic: true, extension: 'png' }) || "https://cdn.discordapp.com/embed/avatars/0.png"))
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('### 👑 TOP AUTHORITY'),
                new TextDisplayBuilder().setContent(`**Owner:** ${ownerTag}\n**Created:** ${createdFull}`),
                new TextDisplayBuilder().setContent('### 👥 POPULATION'),
                new TextDisplayBuilder().setContent(`**Total:** \`1\` | **Humans:** \`1\` | **Bots:** \`0\``),
                new TextDisplayBuilder().setContent('### 💬 INFRASTRUCTURE'),
                new TextDisplayBuilder().setContent(`**Channels:** \`1\` text / \`0\` voice`),
                new TextDisplayBuilder().setContent('### 🚀 BOOST STATUS'),
                new TextDisplayBuilder().setContent(`**Level:** \`${boostLevel}\` | **Count:** \`${boostCount}\``)
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('*Requested by User*'))
            .setAccentColor(0xffffff);

        await channel.send({
            flags: 32768,
            components: [container]
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
