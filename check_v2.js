const Discord = require('discord.js');
console.log('Discord.js Version:', Discord.version);
console.log('SectionBuilder exists:', !!Discord.SectionBuilder);
console.log('ContainerBuilder exists:', !!Discord.ContainerBuilder);
console.log('TextDisplayBuilder exists:', !!Discord.TextDisplayBuilder);
console.log('SeparatorBuilder exists:', !!Discord.SeparatorBuilder);
console.log('ThumbnailBuilder exists:', !!Discord.ThumbnailBuilder);

try {
    const td = new Discord.TextDisplayBuilder().setContent('test');
    console.log('TextDisplayBuilder instantiated successfully');
} catch (e) {
    console.error('TextDisplayBuilder instantiation failed:', e.message);
}

try {
    const cb = new Discord.ContainerBuilder().addTextDisplayComponents({ type: 10, content: 'test' });
    console.log('ContainerBuilder instantiated successfully');
} catch (e) {
    console.error('ContainerBuilder instantiation failed:', e.message);
}
