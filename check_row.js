const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('test').setLabel('Test').setStyle(ButtonStyle.Primary)
);
console.log('Row keys:', Object.keys(row));
console.log('Row components:', JSON.stringify(row.components, null, 2));
console.log('Row data:', JSON.stringify(row.data, null, 2));
