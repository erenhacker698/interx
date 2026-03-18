const Discord = require('discord.js');

/**
 * interX V2 Compatibility Shim
 * This file patches discord.js to provide missing / experimental builders
 * to ensure the bot doesn't crash on standard djs installations.
 */

// 1. Define Mock Builders that actually store data
if (!Discord.HeadingBuilder) {
    Discord.HeadingBuilder = class HeadingBuilder {
        constructor() { this.data = { type: 1 }; }
        setText(t) { this.data.text = t; return this; }
        setContent(t) { this.data.text = t; return this; }
        setLevel(l) { this.data.level = l; return this; }
        toJSON() {
            const level = this.data.level || 1;
            const hashes = '#'.repeat(level);
            return { type: 10, content: `${hashes} ${this.data.text}` };
        }
    };
}

if (!Discord.TextDisplayBuilder) {
    Discord.TextDisplayBuilder = class {
        constructor() { this.data = { type: 10, content: "" }; }
        setContent(c) { this.data.content = c; return this; }
        toJSON() { return this.data; }
    }
}

if (!Discord.SeparatorBuilder) {
    Discord.SeparatorBuilder = class {
        constructor() { this.data = { type: 14 }; }
        toJSON() { return this.data; }
    }
}

if (!Discord.ThumbnailBuilder) {
    Discord.ThumbnailBuilder = class {
        constructor() { this.data = { type: 11, media: { url: "" } }; }
        setURL(u) { this.data.media.url = u; return this; }
        toJSON() { return this.data; }
    }
}

if (!Discord.SectionBuilder) {
    Discord.SectionBuilder = class {
        constructor() { this.data = { type: 9, components: [] }; }
        addTextDisplayComponents(...c) { this.data.components.push(...c.map(i => i.toJSON ? i.toJSON() : i)); return this; }
        setButtonAccessory(b) { this.data.accessory = { type: 2, ...b.toJSON() }; return this; }
        setThumbnailAccessory(t) { this.data.accessory = t.toJSON ? t.toJSON() : t; return this; }
        toJSON() { return this.data; }
    }
}

if (!Discord.ContainerBuilder) {
    Discord.ContainerBuilder = class {
        constructor() { this.data = { type: 17, components: [] }; }
        addSectionComponents(s) { this.data.components.push(s.toJSON ? s.toJSON() : s); return this; }
        addSeparatorComponents(s) { this.data.components.push(s.toJSON ? s.toJSON() : s); return this; }
        addTextDisplayComponents(t) { this.data.components.push(t.toJSON ? t.toJSON() : t); return this; }
        addActionRowComponents(r) { this.data.components.push(r.toJSON ? r.toJSON() : r); return this; }
        setAccentColor(c) { this.data.accent_color = c; return this; }
        toJSON() { return this.data; }
    }
}

// Global assignments
const builders = ['SeparatorBuilder', 'ContainerBuilder', 'SectionBuilder', 'TextDisplayBuilder', 'ThumbnailBuilder', 'HeadingBuilder'];
builders.forEach(b => {
    if (!global[b]) global[b] = Discord[b];
});

if (!Discord.SeparatorSpacingSize) Discord.SeparatorSpacingSize = { Small: 1, Medium: 2, Large: 3 };
if (!Discord.HeadingLevel) Discord.HeadingLevel = { Level1: 1, Level2: 2, Level3: 3 };

console.log('✅ [V2_SHIM] Discord.js patched for V2 compatibility (with Data Persistence).');
