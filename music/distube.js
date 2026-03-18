const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SpotifyPlugin } = require("@distube/spotify");

module.exports = (client) => {

    client.distube = new DisTube(client, {
        emitNewSongOnly: true,
        plugins: [
            new YouTubePlugin(),
            new SpotifyPlugin()
        ]
    });

};