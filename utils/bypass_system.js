const BOT_OWNER_ID = "1250850375284818104";

function isBypass(userId) {
    return userId === BOT_OWNER_ID;
}

module.exports = {
    BOT_OWNER_ID,
    isBypass
};
