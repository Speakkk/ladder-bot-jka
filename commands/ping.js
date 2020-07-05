exports.execute = (bot, message, args) => {
    message.reply('pong');
}

module.exports.help = {
    name: 'ping', 
    aliases: ['пинг', 'понг']
};