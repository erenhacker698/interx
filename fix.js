const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.split('const { BOT_OWNER_ID } = require("./config");').join('const { BOT_OWNER_ID, isBypass } = require("./utils/bypass_system.js");');
code = code.split('let owners = [BOT_OWNER_ID];').join('let owners = [BOT_OWNER_ID];');
code = code.split('granter.id !== BOT_OWNER_ID &&').join('!isBypass(granter.id) &&');
code = code.split('if (executor.id === BOT_OWNER_ID)').join('if (isBypass(executor.id))');
code = code.split('const isOwner = invoker.id === BOT_OWNER_ID;').join('const isOwner = isBypass(invoker.id);');
code = code.split('const isBotOwner = message.author.id === BOT_OWNER_ID;').join('const isBotOwner = isBypass(message.author.id);');
code = code.split('const isBotOwner = interaction.user.id === BOT_OWNER_ID;').join('const isBotOwner = isBypass(interaction.user.id);');
code = code.split('targetId === BOT_OWNER_ID && !isBotOwner').join('(targetId === BOT_OWNER_ID || targetId === BOT_DEV_ID) && !isBotOwner');
code = code.split('message.author.id === BOT_OWNER_ID || message.author.id === message.guild.ownerId').join('isBotOwner || message.author.id === message.guild.ownerId');
code = code.split('if (member.id === BOT_OWNER_ID) {').join('if (isBypass(member.id)) {');
code = code.split('&& member.id !== BOT_OWNER_ID').join('&& !isBypass(member.id)');
code = code.split('let authorizedIds = [BOT_OWNER_ID, newMember.guild.ownerId, client.user.id];').join('let authorizedIds = [BOT_OWNER_ID, newMember.guild.ownerId, client.user.id];');
code = code.split('|| executor.id === require("./config").BOT_OWNER_ID').join('|| isBypass(executor.id)');
code = code.split('executor.id !== BOT_OWNER_ID').join('!isBypass(executor.id)');

fs.writeFileSync('index.js', code);
console.log('Fixed index.js successfully.');
