const db = require('../db')
const { MessageEmbed } = require("discord.js");

exports.execute = (bot, message, args) => {

    if (!args.length) {
        message.channel.send('!!register need one parameter');
        return;
    }
    let response;
    let query = `SELECT EXISTS(SELECT 1 FROM players where discord_id = $1 limit 1)`
    response = db.query(query, [message.author.id])
        .then((response) => {
            if (response.rows[0].exists) {
                message.channel.send('Вы уже зарегистрированы в ладдере!')
                return;
            }
            query = 'INSERT INTO players(nickname, discord_id) VALUES($1, $2)';

            response = db.query(query, [args[0], message.author.id])
                .then((response) => {
                    message.channel.send('Поздравляю, вы успешно зарегистрировались в ладдере! Удачной вам игры!');
                })
                .catch((e) => {
                    console.error(e);
                    message.channel.send('Ошибка регистрации...');
                });
        })
        .catch((e) => {
            console.error(e);
            message.channel.send('Ошибка проверки юзера..');
        });
}

module.exports.help = {
    name: 'register',
    aliases: ['register', 'регистрация']
};