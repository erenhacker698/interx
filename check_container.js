const { ContainerBuilder } = require('discord.js');
console.log('ContainerBuilder prototype:', Object.getOwnPropertyNames(ContainerBuilder.prototype));
try {
    const c = new ContainerBuilder();
    console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(c)));
} catch (e) {
    console.error(e);
}
