const { Player } = require("discord-player");
const { YoutubeExtractor } = require("@discord-player/extractor");

module.exports = (client) => {
    const player = new Player(client);

    player.extractors.loadDefault();

    return player;
};