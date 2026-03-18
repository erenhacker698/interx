const Discord = require('discord.js');
console.log("ContainerBuilder:", !!Discord.ContainerBuilder);
console.log("SectionBuilder:", !!Discord.SectionBuilder);
console.log("TextDisplayBuilder:", !!Discord.TextDisplayBuilder);
console.log("MessageFlags.IsComponentsV2:", !!(Discord.MessageFlags && Discord.MessageFlags.IsComponentsV2));
