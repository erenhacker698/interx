const path = require("path");
const fastCache = require("./fastCache");

const BOT_OWNER_ID = "1250850375284818104";
const BOT_DEV_ID = "783953632974471178";

/**
 * CHECK BYPASS AUTHORITY
 * Checks if a user is the Architect (Bot Owner) or part of the Trust Chain (Extra Owners).
 */
function isBypass(userId, guildId = null) {
    if (userId === BOT_OWNER_ID || userId === BOT_DEV_ID) return true;
    if (!guildId) return false;

    const ownersDbPath = path.join(__dirname, "../data/owners.json");
    try {
        const data = fastCache.get(ownersDbPath);
        const guildOwners = data[guildId];
        if (Array.isArray(guildOwners)) {
            return guildOwners.includes(userId);
        }
    } catch (e) {}

    return false;
}

module.exports = {
    BOT_OWNER_ID,
    BOT_DEV_ID,
    isBypass
};
