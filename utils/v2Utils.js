const Discord = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = Discord;

/**
 * Unique Ultimate interX V2 UI Generator
 * Converts V2 Component abstract layouts into magnificent, rich red-themed Embeds.
 */
class V2Helper {
    static text(content) {
        return { type: 'text', content: content };
    }

    static heading(text, level = 1) {
        const icons = ["🛑", "⚡", "📊"];
        const icon = icons[level - 1] || "🔹";
        return { type: 'heading', content: `### ${icon} ${text.toUpperCase()}` };
    }

    static button(id, label, style = ButtonStyle.Secondary, disabled = false) {
        return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setDisabled(disabled);
    }

    static linkButton(url, label) {
        return new ButtonBuilder().setURL(url).setLabel(label).setStyle(ButtonStyle.Link);
    }

    static container(components = [], accentColor = null) {
        const embed = new EmbedBuilder();
        
        // interX Premier Red Theme overriding
        let color = 0xFF0033;
        if (accentColor) {
            color = typeof accentColor === 'string' ? parseInt(accentColor.replace('#', ''), 16) : accentColor;
            if (color === 0x0099ff || color === 0) color = 0xFF0033; // Force Red Theme
        }
        embed.setColor(color);
        embed.setFooter({ text: "interX Sovereign System • Ultimate UI Protocol", iconURL: "https://media.discordapp.net/attachments/1093150036663308318/1113885934572900454/line-red.gif" });
        embed.setTimestamp();

        let description = "";
        
        for (const c of components) {
            if (c instanceof ActionRowBuilder) {
                // Return an array of components if we encounter ActionRows?
                // For now, this helper just builds the embed. ActionRows are handled in Message/Channel patch if needed.
                continue;
            }
            if (c && c.type === 'section') {
                if (c.thumbnail) embed.setThumbnail(c.thumbnail);
                if (c.image) embed.setImage(c.image);
                description += c.content + "\n\n";
            } else if (c && c.type === 'separator') {
                description += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
            } else if (c && (c.type === 'text' || c.type === 'heading')) {
                description += c.content + "\n";
            } else if (typeof c === 'string') {
                description += c + "\n";
            }
        }

        embed.setDescription(description.trim() || ' ');

        return { isUltimateEmbed: true, embed: embed };
    }

    static section(components = [], accessory = null) {
        let content = "";
        const comps = Array.isArray(components) ? components : [components];
        
        for (const c of comps) {
            if (c && (c.type === 'text' || c.type === 'heading')) {
                content += c.content + "\n";
            } else if (typeof c === 'string') {
                content += c + "\n";
            }
        }

        let thumbnail = null;
        let image = null;

        if (accessory) {
            if (typeof accessory === 'string') {
                thumbnail = accessory;
            } else if (accessory.data && accessory.data.media) {
                thumbnail = accessory.data.media.url;
            } else if (accessory.url) {
                thumbnail = accessory.url;
            } else if (accessory.type === 'image') {
                image = accessory.url;
            }
        }

        return { type: 'section', content: content.trim(), thumbnail, image };
    }

    static separator() {
        return { type: 'separator' };
    }

    static thumbnail(url) {
        return { type: 'thumbnail', url };
    }

    static field(name, value, inline = false) {
        return { type: 'section', content: `**${name}**\n${value}` };
    }

    static fromEmbed(embed) {
        // Dummy passthrough
        return [];
    }

    static wrapMessage(message) {
        return message; // No longer needed as we natively patched index.js!
    }

    static wrapSentMessage(message) {
        const originalEdit = message.edit.bind(message);
        message.edit = async (options) => {
            if (typeof options === 'object' && options.components) {
                let newComponents = [];
                let newEmbeds = options.embeds || [];
                for (let c of options.components) {
                    if (c && c.isUltimateEmbed) {
                        newEmbeds.push(c.embed);
                    } else {
                        newComponents.push(c);
                    }
                }
                options.components = newComponents;
                if (newEmbeds.length > 0) options.embeds = newEmbeds;
            }
            return originalEdit(options);
        };
        return message;
    }

    static botAvatar(message) {
        const client = message.client || message;
        const member = message.guild?.members?.me;
        return member?.displayAvatarURL({ forceStatic: true, extension: "png", size: 512 })
            || client.user?.displayAvatarURL({ forceStatic: true, extension: "png", size: 512 });
    }

    static get flag() {
        return 0; // Not using V2 flags anymore since we use standard Embeds.
    }
}

module.exports = V2Helper;
