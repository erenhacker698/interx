const { Client, GatewayIntentBits } = require('discord.js');
const { TOKEN } = require('./config');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`[SYSTEM] Logged in as ${client.user.tag}`);
    console.log(`[SYSTEM] Initializing Global Identity Restoration...`);

    try {
        const app = await client.application.fetch();
        const iconURL = app.iconURL({ extension: 'png', size: 1024 });

        if (!iconURL) {
            console.log("❌ CRITICAL: No application icon found in the Developer Portal.");
            console.log("Please ensure you have set an icon in the Discord Developer Portal for this application.");
        } else {
            console.log(`[INTEL] Application Icon located: ${iconURL}`);
            await client.user.setAvatar(iconURL);
            console.log("✅ SUCCESS: Global Bot Avatar successfully restored to the Application Icon.");
            console.log("Changes may take a few minutes to reflect across all servers due to Discord's cache.");
        }
    } catch (err) {
        console.error("❌ ERROR: Restoration process failed.");
        console.error(err);
        if (err.code === 50035) {
            console.log("Possible causes: Rate limiting or the icon URL is invalid.");
        }
    } finally {
        console.log(`[SYSTEM] Task complete. Terminating session.`);
        client.destroy();
        process.exit(0);
    }
});

client.login(TOKEN).catch(err => {
    console.error("❌ LOGIN ERROR: Could not connect to Discord.");
    console.error(err);
    process.exit(1);
});
