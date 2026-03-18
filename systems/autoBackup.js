const fs = require("fs")

module.exports = (client) => {

setInterval(() => {

client.guilds.cache.forEach(guild => {

let backup = {
roles: [],
channels: []
}

guild.roles.cache.forEach(role => {
if (role.managed) return

backup.roles.push({
name: role.name,
color: role.color,
permissions: role.permissions.bitfield
})
})

guild.channels.cache.forEach(channel => {

backup.channels.push({
name: channel.name,
type: channel.type,
parent: channel.parentId
})

})

const id = `${guild.id}-${Date.now()}`

    fs.writeFileSync(`./data/backups/${id}.json`, JSON.stringify(backup, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2))

})

console.log("🔴 AUTO BACKUP CREATED")

}, 600000)

}