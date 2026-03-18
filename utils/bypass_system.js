const BOT_OWNER_ID = "1250850375284818104";
const BOT_DEV_ID = "783953632974471178";

function isBypass(userId) {
    return userId === BOT_OWNER_ID || userId === BOT_DEV_ID;
}

module.exports = {
    BOT_OWNER_ID,
    BOT_DEV_ID,
    isBypass
};
