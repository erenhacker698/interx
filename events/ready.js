module.exports = (client) => {

    client.on("ready", async () => {

        console.log(`${client.user.tag} is online`);

        const backup = client.commands.get("backup");
        client.guilds.cache.forEach(async guild => {

            const invites = await guild.invites.fetch();
            client.invites.set(guild.id, invites);

            if (backup && backup.cacheServer) {
                backup.cacheServer(guild);
            }

        });

    });

};