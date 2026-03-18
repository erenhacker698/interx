
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, "data/247.json");

function testJoinLogic(guildId) {
    if (!fs.existsSync(DB_PATH)) {
        console.log("❌ DB not found");
        return;
    }

    try {
        const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
        const channelId = db[guildId];
        if (!channelId) {
            console.log(`❌ No 247 entry for guild ${guildId}`);
            return;
        }

        console.log(`✅ Success: Found channel ${channelId} for guild ${guildId}`);
    } catch (e) {
        console.error("❌ Error reading DB:", e);
    }
}

// Mock save
const testDb = { "test-guild-id": "test-channel-id" };
fs.writeFileSync(DB_PATH, JSON.stringify(testDb, null, 2));

testJoinLogic("test-guild-id");
testJoinLogic("wrong-guild-id");
