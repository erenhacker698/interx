const fs = require("fs");
const path = require("path");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { BOT_OWNER_ID, BOT_DEV_ID } = require("../config");
const DATA_DIR = path.join(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "welcome.json");

// ───── DATA MANAGEMENT ─────
function loadWelcomeData() {
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

function saveWelcomeData(data) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "welcome",
    description: "Configure the premium welcome system",
    usage: "!welcome set #channel | !welcome test | !welcome off",
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
            const argsList = args.slice(1);
            const channel = message.mentions.channels.first() || message.guild.channels.cache.get(argsList[0]);

            if (!channel) {
                return message.reply("⚠️ **Usage:** `!welcome set #joins [image_url] [@role]`\nExample: `!welcome set #joins https://...gif @Member`", { });
            }

            let imgUrl = null;
            let roleId = null;

            // Simple parsing for remaining args
            for (let i = 1; i < argsList.length; i++) {
                const arg = argsList[i];
                if (arg.startsWith("http")) imgUrl = arg;
                else if (arg.match(/<@&(\d+)>/)) roleId = arg.match(/<@&(\d+)>/)[1];
                else if (message.guild.roles.cache.has(arg)) roleId = arg;
                else if (["off", "none", "clear"].includes(arg.toLowerCase())) {
                    // If 'off' is provided, we clear both but the user might want to clear specific ones.
                    // For now, let's treat it as a clear signal for whatever follows.
                }
            }

            const data = loadWelcomeData();
            data[message.guild.id] = channel.id;

            if (imgUrl || argsList.includes("off") || argsList.includes("none")) {
                if (!data.custom_imgs) data.custom_imgs = {};
                if (["off", "none"].includes(imgUrl?.toLowerCase()) || argsList.includes("off") || argsList.includes("none")) {
                    delete data.custom_imgs[message.guild.id];
                } else if (imgUrl) {
                    data.custom_imgs[message.guild.id] = imgUrl;
                }
            }

            if (roleId || argsList.includes("off") || argsList.includes("none")) {
                if (!data.verify_roles) data.verify_roles = {};
                if (["off", "none"].includes(argsList.find(a => ["off", "none"].includes(a.toLowerCase())))) {
                    delete data.verify_roles[message.guild.id];
                } else if (roleId) {
                    data.verify_roles[message.guild.id] = roleId;
                }
            }

            saveWelcomeData(data);

            const container = V2.container([
                V2.section([
                    "✅ WELCOME RECONFIGURED",
                    V2.text(`**Premium Welcome System** is now active in ${channel}.` +
                        (imgUrl ? `\n🖼️ **Custom visual saved.**` : "") +
                        (roleId ? `\n🔘 **Verification button enabled.**` : "")
                    )
                ]),
                imgUrl && !["off", "none"].includes(imgUrl.toLowerCase()) ? V2.section([], { type: 'image', url: imgUrl }) : null,
                "*interX • Automation Kernel*"
            ].filter(Boolean), "#00FF00");

            return message.reply({ content: null, components: [container] });
        }

        // ───── DM TOGGLE & TEST ─────
        if (subCommand === "dm") {
            const toggle = args[1]?.toLowerCase();

            if (toggle === "test") {
                const moment = require("moment");
                const dmEmbed = new EmbedBuilder()
                    .setColor("#00EEFF")
                    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true, size: 1024 }) })
                    .setTitle(`👋 Welcome to ${message.guild.name}!`)
                    .setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024 }))
                    .setDescription(`Welcome to the server, ${message.author}!! We're glad to have you here! 🎉\n\n**Server:** ${message.guild.name}`)
                    .setImage(message.guild.bannerURL({ size: 1024 }) || message.guild.iconURL({ size: 1024, dynamic: true }))
                    .setFooter({ text: `Joined on ${moment().format("DD MMMM YYYY, h:mm A")}` });

                try {
                    await message.author.send({ embeds: [dmEmbed] });
                    return message.reply("✅ **Simulation Complete:** Sent the standard Welcome DM preview!");
                } catch (e) {
                    console.error("DM Test Error (Welcome):", e);
                    return message.reply("⚠️ **Simulation Failed:** I couldn't deliver the DM. This is usually due to closed DMs or a temporary API issue.");
                }
            }

            if (toggle !== "on" && toggle !== "off") {
                return message.reply("⚠️ **Usage:** `!welcome dm on`, `!welcome dm off`, or `!welcome dm test`.");
            }

            const data = loadWelcomeData();
            if (!data.dm_config) data.dm_config = {};
            data.dm_config[message.guild.id] = toggle === "on";
            saveWelcomeData(data);

            const container = V2.container([
                V2.section([
                    "✅ DM CONFIGURATION UPDATED",
                    `**Premium Welcome DMs** are now **${toggle.toUpperCase()}** for this server.`
                ]),
                "*interX • Automation Kernel*"
            ], "#00FF00");

            return message.reply({ content: null, components: [container] });
        }

        // ───── DISABLE ─────
        if (subCommand === "off") {
            const data = loadWelcomeData();
            if (!data[message.guild.id]) {
                return message.reply("ℹ️ Welcome system is already disabled.");
            }
            delete data[message.guild.id];
            saveWelcomeData(data);
            return message.reply("✅ **Welcome system disabled.**");
        }

        // ───── TEST ─────
        if (subCommand === "test") {
            try {
                const data = loadWelcomeData();
                const verifyRole = data.verify_roles ? data.verify_roles[message.guild.id] : null;
                const memberCount = message.guild.memberCount;
                const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                const container = V2.container([
                    V2.section([
                        `**Time:** ${timeStr}`,
                        `**Executed by:** ${message.author}`
                    ], message.guild.iconURL({ dynamic: true, size: 512, forceStatic: true, extension: 'png' })),
                    `\u200b`,
                    `**Welcome to ${message.guild.name}**`,
                    `\u200b`,
                    `${message.author}, your presence strengthens our hierarchy. You are now recognized as our **${memberCount}th** operative.`,
                    `\u200b`,
                    `Sovereign protection managed by <@${message.client.user.id}>`,
                    `\u200b`,
                    `Architect: <@${BOT_OWNER_ID}>`,
                    verifyRole ? new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`verify_${message.guild.id}`)
                            .setLabel("Veriffy")
                            .setStyle(ButtonStyle.Success)
                    ) : null
                ].filter(Boolean));

                return message.reply({ content: null, components: [container] });
            } catch (e) {
                console.error("Welcome Test Error:", e);
                return message.reply("❌ FAILD TO INITIALIZE SIMULATION CORE.");
            }
        }

        const helpContainer = V2.container([
            V2.section([
                "🤖 WELCOME SYSTEM CONTROL",
                V2.text(
                    `### **[ CONFIGURATION_GUIDE ]**\n\n` +
                    `> • **!welcome set #ch [img] [@role]** - Set automation parameters\n` +
                    `> • **!welcome off** - Decommission welcome protocols\n` +
                    `> • **!welcome test** - Preview channel visual\n\n` +
                    `### **[ DIRECT_MESSAGE_MOD ]**\n` +
                    `> • **!welcome dm <on/off>** - Toggle private greeting\n` +
                    `> • **!welcome dm test** - Preview DM visual`
                )
            ]),
            "*interX • Automation Suite*"
        ], "#0099ff");

        return message.reply({ content: null, components: [helpContainer] });
    },

    async generateWelcomeImage(member) {
        const { createCanvas, loadImage, registerFont } = require('canvas');

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

        // Add subtle stylish pattern (Hexagons)
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

        // 2. The "Left" (lft) - Sidebar / Accent
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

        // 3. Avatar (Center of Left Panel)
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

        // 4. Text Content (Right Side)
        const textStartX = leftWidth;
        const contentWidth = width - textStartX;
        const centerX = textStartX + (contentWidth / 2);

        ctx.textAlign = 'center';

        // "WELCOME"
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 60px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('WELCOME', centerX, height / 2 - 70);

        // Username
        ctx.font = 'bold 45px sans-serif';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(member.user.username, centerX, height / 2 - 10);

        // "to"
        ctx.font = 'italic 25px serif';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('to', centerX, height / 2 + 30);

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

        // Glassmorphism Badge Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);

        // Badge Border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#eeeeee';
        ctx.shadowBlur = 0;
        ctx.fillText(`MEMBER #${member.guild.memberCount}`, centerX, badgeY + 27);

        return canvas.toBuffer();
    }
};

