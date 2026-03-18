const { EmbedBuilder } = require("discord.js");

module.exports = {

    redEmbed(title, description) {

        return new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

    }

};