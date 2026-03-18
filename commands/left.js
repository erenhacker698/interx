const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "left.json");

// ───── DATA MANAGEMENT ─────
function loadLeftData() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    } catch {
        return {};
    }
}

function saveLeftData(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "left",
    description: "Configure the premium goodbye system",
    usage: "!left set #channel | !left test | !left off",
    permissions: [PermissionsBitField.Flags.ManageGuild],

    async execute(message, args) {
        const isBotOwner = ((message.author.id === BOT_OWNER_ID || message.author.id === BOT_DEV_ID));
        const isServerOwner = message.guild.ownerId === message.author.id;

        if (!isBotOwner && !isServerOwner && !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply({ content: "🚫 **ACCESS DENIED:** You need Manage Server permission." });
        }

        const subCommand = args[0]?.toLowerCase();

        // ───── CONFIGURATION ─────
        if (subCommand === "set") {
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
            const imgUrl = args[2];

            if (!channel) {
                return message.reply("⚠️ **Please mention a valid channel.**\nUsage: `!left set #goodbyes [optional_img_url]`", { });
            }

            const data = loadLeftData();
            data[message.guild.id] = channel.id;

            if (imgUrl) {
                if (!data.custom_imgs) data.custom_imgs = {};
                if (["off", "none", "clear", "remove"].includes(imgUrl.toLowerCase())) {
                    delete data.custom_imgs[message.guild.id];
                } else {
                    data.custom_imgs[message.guild.id] = imgUrl;
                }
            }

            saveLeftData(data);

            const container = V2.container([
                V2.section([
                    "✅ GOODBYE SYSTEM INITIALIZED",
                    V2.text(`**Premium Farewell Protocol** is now monitoring departures in ${channel}.` + (imgUrl ? `\n\n🖼️ **Custom image/GIF saved.**` : ""))
                ]),
                imgUrl ? V2.section([], { type: 'image', url: imgUrl }) : null,
                "*interX • Automation Kernel*"
            ].filter(Boolean), "#FF4500");

            return message.reply({ content: null, components: [container] });
        }

        // ───── DM TOGGLE & TEST ─────
        if (subCommand === "dm") {
            const toggle = args[1]?.toLowerCase();

            if (toggle === "test") {
                const moment = require("moment");
                const dmEmbed = new EmbedBuilder()
                    .setColor("#FF4500")
                    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true, size: 1024 }) })
                    .setTitle(`📤 Farewell from ${message.guild.name}!`)
                    .setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024 }))
                    .setDescription(`Goodbye, ${message.author}!! We're sad to see you leave, but we hope you enjoyed your stay! ❤️\n\n**Server:** ${message.guild.name}`)
                    .setImage(message.guild.bannerURL({ size: 1024 }) || message.guild.iconURL({ size: 1024, dynamic: true }))
                    .setFooter({ text: `Left on ${moment().format("DD MMMM YYYY, h:mm A")}` });

                try {
                    await message.author.send({ embeds: [dmEmbed] });
                    return message.reply("✅ **Simulation Complete:** Sent the standard Farewell DM preview!");
                } catch (e) {
                    console.error("DM Test Error (Left):", e);
                    return message.reply("⚠️ **Simulation Failed:** I couldn't deliver the DM. This is usually due to closed DMs or a temporary API issue.");
                }
            }

            if (toggle !== "on" && toggle !== "off") {
                return message.reply("⚠️ **Usage:** `!left dm on`, `!left dm off`, or `!left dm test`.");
            }

            const data = loadLeftData();
            if (!data.dm_config) data.dm_config = {};
            data.dm_config[message.guild.id] = toggle === "on";
            saveLeftData(data);

            const container = V2.container([
                V2.section([
                    "✅ DM CONFIGURATION UPDATED",
                    `**Premium Farewell DMs** are now **${toggle.toUpperCase()}** for this server.`
                ]),
                "*interX • Automation Kernel*"
            ], "#FF4500");

            return message.reply({ content: null, components: [container] });
        }

        // ───── DISABLE ─────
        if (subCommand === "off") {
            const data = loadLeftData();
            if (!data[message.guild.id]) {
                return message.reply("ℹ️ Goodbye system is already disabled.");
            }
            delete data[message.guild.id];
            saveLeftData(data);
            return message.reply("✅ **Goodbye system disabled.**");
        }

        // ───── TEST ─────
        if (subCommand === "test") {
            try {
                const data = loadLeftData();
                const memberCount = message.guild.memberCount;
                const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                const container = V2.container([
                    V2.section([
                        `**Time:** ${timeStr}`,
                        `**Executed by:** ${message.author}`
                    ], message.guild.iconURL({ dynamic: true, size: 512, forceStatic: true, extension: 'png' })),
                    `\u200b`,
                    `**Farewell from ${message.guild.name}**`,
                    `\u200b`,
                    `${message.author}, your departure has been logged. We hope our paths cross again in the void.`,
                    `\u200b`,
                    `Sovereign protection remains active via <@${message.client.user.id}>`,
                    `\u200b`,
                    `Architect: <@${BOT_OWNER_ID}>` ].filter(Boolean));

                return message.reply({ content: null, components: [container] });
            } catch (e) {
                console.error("Left Test Error:", e);
                return message.reply("❌ FAILD TO INITIALIZE SIMULATION CORE.");
            }
        }

        const helpContainer = V2.container([
            V2.section([
                "🤖 GOODBYE SYSTEM CONTROL",
                V2.text(
                    `### **[ CONFIGURATION_GUIDE ]**\n\n` +
                    `> • **!left set #ch [img]** - Set channel & optional GIF\n` +
                    `> • **!left off** - Decommission departure protocols\n` +
                    `> • **!left test** - Preview channel visual\n\n` +
                    `### **[ DIRECT_MESSAGE_MOD ]**\n` +
                    `> • **!left dm <on/off>** - Toggle private farewell\n` +
                    `> • **!left dm test** - Preview DM visual`
                )
            ]),
            "*interX • Automation Suite*"
        ], "#FF4500");

        return message.reply({ content: null, components: [helpContainer] });
    },

    async generateGoodbyeImage(member) {
        const { createCanvas, loadImage } = require('canvas');

        // Settings
        const width = 900;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 1. Background (Premium Dark Depth)
        const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 100, width, height, 600);
        bgGradient.addColorStop(0, '#1a1a1a');
        bgGradient.addColorStop(1, '#050505');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Pattern
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 60) {
            for (let j = 0; j < height; j += 52) {
                ctx.beginPath();
                ctx.moveTo(i + 30, j);
                ctx.lineTo(i + 60, j + 17);
                ctx.lineTo(i + 60, j + 52);
                ctx.lineTo(i + 30, j + 69);
                ctx.lineTo(i, j + 52);
                ctx.lineTo(i, j + 17);
                ctx.closePath();
                ctx.stroke();
            }
        }
        ctx.restore();

        // 2. The "Left" (lft) - Sidebar (BLUE Theme - Matching Welcome)
        const leftWidth = 300;
        const sidebarGradient = ctx.createLinearGradient(0, 0, leftWidth, height);
        sidebarGradient.addColorStop(0, '#000428'); // Dark Navy
        sidebarGradient.addColorStop(1, '#004e92'); // Royal Blue

        ctx.fillStyle = sidebarGradient;
        ctx.fillRect(0, 0, leftWidth, height);

        // Sidebar Pattern Overlay
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#00ffff';
        for (let y = 0; y < height; y += 10) {
            ctx.fillRect(0, y, leftWidth, 1);
        }
        ctx.restore();

        // Separator Line (Glowing)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(leftWidth, 0);
        ctx.lineTo(leftWidth, height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Avatar
        const avatarSize = 180;
        const avatarX = leftWidth / 2;
        const avatarY = height / 2;

        // Outer Glow Ring
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, (avatarSize / 2) + 8, 0, Math.PI * 2, true);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Load Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarUrl);

        // Circular Avatar Clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX - (avatarSize / 2), avatarY - (avatarSize / 2), avatarSize, avatarSize);
        ctx.restore();

        // Inner Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.stroke();

        // 4. Text Content
        const textStartX = leftWidth;
        const contentWidth = width - textStartX;
        const centerX = textStartX + (contentWidth / 2);

        ctx.textAlign = 'center';

        // "GOODBYE"
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GOODBYE', centerX, height / 2 - 70);

        // Username
        ctx.font = 'bold 45px sans-serif';
        ctx.fillStyle = '#00ffff'; // Cyan to match welcome
        ctx.fillText(member.user.username, centerX, height / 2 - 10);

        // "from"
        ctx.font = 'italic 25px serif';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('from', centerX, height / 2 + 30);

        // Server Name (GOLD GRADIENT TEXT)
        ctx.font = 'bold 50px serif';
        const textGradient = ctx.createLinearGradient(0, 0, width, 0);
        textGradient.addColorStop(0, '#BF953F'); // Gold Dark
        textGradient.addColorStop(0.3, '#FBF5B7'); // Gold Light
        textGradient.addColorStop(0.6, '#AA771C'); // Gold Dark
        textGradient.addColorStop(1, '#BF953F'); // Gold Dark
        ctx.fillStyle = textGradient;
        ctx.fillText(member.guild.name.toUpperCase(), centerX, height / 2 + 85);

        // Member Count Badge
        const badgeY = height - 60;
        const badgeW = 220;
        const badgeH = 40;
        const badgeX = centerX - (badgeW / 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#eeeeee';
        ctx.shadowBlur = 0;
        ctx.fillText(`MEMBERS LEFT: ${member.guild.memberCount}`, centerX, badgeY + 27);

        return canvas.toBuffer();
    }
};
