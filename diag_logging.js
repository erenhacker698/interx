
const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel]
});

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    const guilds = client.guilds.cache.map(g => ({ id: g.id, name: g.name }));
    console.log('Current Guilds:', JSON.stringify(guilds, null, 2));

    const logsPath = path.join(__dirname, 'data/logs.json');
    if (fs.existsSync(logsPath)) {
        const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
        console.log('--- Logging Check ---');
        for (const [guildId, config] of Object.entries(logs)) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                console.log(`Guild ${guildId} NOT FOUND in cache.`);
                continue;
            }
            console.log(`Guild: ${guild.name} (${guildId})`);
            for (const [type, channelId] of Object.entries(config)) {
                try {
                    const channel = await client.channels.fetch(channelId).catch(() => null);
                    console.log(`  - ${type}: ${channelId} -> ${channel ? '#' + channel.name : 'MISSSING/ACCESSIBLE'}`);
                } catch (e) {
                    console.log(`  - ${type}: ${channelId} -> ERROR: ${e.message}`);
                }
            }
        }
    } else {
        console.log('logs.json NOT FOUND');
    }

    const elogsPath = path.join(__dirname, 'data/elogs.json');
    if (fs.existsSync(elogsPath)) {
        const elogs = JSON.parse(fs.readFileSync(elogsPath, 'utf8'));
        console.log('--- Global Logging Check ---');
        for (const [type, channelId] of Object.entries(elogs)) {
            try {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                console.log(`  - ${type}: ${channelId} -> ${channel ? '#' + channel.name + ' in ' + channel.guild.name : 'MISSING'}`);
            } catch (e) {
                console.log(`  - ${type}: ${channelId} -> ERROR: ${e.message}`);
            }
        }
    } else {
        console.log('elogs.json NOT FOUND');
    }

    process.exit(0);
});

client.login(process.env.TOKEN);
