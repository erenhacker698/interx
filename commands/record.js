const {
    joinVoiceChannel,
    EndBehaviorType
} = require('@discordjs/voice');

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const prism = require('prism-media');
const fs = require('fs');

module.exports = {
    name: "r",
    description: "Start recording VC",

    async execute(message) {
        const channel = message.member.voice.channel;
        if (!channel) {
            return message.reply("❌ Join a voice channel first.");
        }

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false,
        });

        const embed = new EmbedBuilder()
            .setColor("#8B0000")
            .setTitle("🔴 Recording Started")
            .setDescription(`Recording + DM sending enabled in **${channel.name}**`)
            .setFooter({ text: "AntiNuke Recorder System" });

        message.reply({ embeds: [embed] });

        const receiver = connection.receiver;

        receiver.speaking.on('start', (userId) => {
            const user = message.guild.members.cache.get(userId);
            if (!user) return;

            const opusStream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 1000,
                },
            });

            const pcmStream = new prism.opus.Decoder({
                frameSize: 960,
                channels: 2,
                rate: 48000,
            });

            const fileName = `./recordings/${user.user.username}-${Date.now()}.pcm`;
            const writeStream = fs.createWriteStream(fileName);

            const finished = new Promise((resolve) => {
                writeStream.on('finish', resolve);
            });

            opusStream.pipe(pcmStream).pipe(writeStream);

            console.log(`🎤 Recording: ${user.user.tag}`);

            finished.then(async () => {
                try {
                    const attachment = new AttachmentBuilder(fileName);

                    const dmEmbed = new EmbedBuilder()
                        .setColor("#ff0404ff")
                        .setTitle("🎤 Voice Recorded")
                        .setDescription(`User: **${user.user.tag}**`)
                        .setFooter({ text: "Recording Delivered" });

                    await message.author.send({
                        embeds: [dmEmbed],
                        files: [attachment]
                    });

                    fs.unlinkSync(fileName); // delete after sending

                } catch (err) {
                    console.log("❌ DM failed:", err.message);
                }
            });
        });
    }
};