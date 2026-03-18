const { SectionBuilder, ContainerBuilder } = require("discord.js");
require("./v2_shim");
const sb = new SectionBuilder();
console.log("Methods of SectionBuilder:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(sb)));
const cb = new ContainerBuilder();
console.log("Methods of ContainerBuilder:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(cb)));
