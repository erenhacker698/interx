const djs = require("discord.js");
console.log("Checking Discord.js version and exports...");
console.log("Version:", djs.version);

const builders = [
    "ContainerBuilder",
    "SectionBuilder",
    "TextDisplayBuilder",
    "ActionRowBuilder",
    "EmbedBuilder"
];

builders.forEach(b => {
    console.log(`${b}:`, typeof djs[b]);
});

console.log("MessageFlags:", typeof djs.MessageFlags);
if (djs.MessageFlags) {
    console.log("MessageFlags.IsComponentsV2:", djs.MessageFlags.IsComponentsV2);
    console.log("All MessageFlags keys:", Object.keys(djs.MessageFlags));
}

try {
    if (djs.ContainerBuilder) {
        const test = new djs.ContainerBuilder();
        console.log("✅ ContainerBuilder instantiated successfully.");
    } else {
        console.log("❌ ContainerBuilder is not exported from 'discord.js'.");
    }
} catch (e) {
    console.log("❌ Error instantiating ContainerBuilder:", e.message);
}
