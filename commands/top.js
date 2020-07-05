const db = require('../db')
const { MessageEmbed } = require("discord.js");
const { Pool } = require('pg');

exports.execute = (bot, message, args) => {
    let limit = !args.length ? 20 : args[0]
    let response;
    let position = '';
    let nickname = '';
    let points = '';
    let query = `SELECT t.nickname, t.points
                        FROM (
                            SELECT DISTINCT ON 
                            (hm.player_id, p.nickname) 
                            p.id,
                            p.nickname,
                            CASE
                            WHEN hm.points IS NULL
                                THEN 1000
                                ELSE hm.points
                            END
                            FROM history_matches hm
                            RIGHT JOIN players p ON p.id = hm.player_id
                            ORDER BY p.nickname, hm.player_id, hm.date DESC
                                    ) t
                        ORDER BY t.points DESC
                        LIMIT $1;`

    response = db.query(query, [limit])
        .then((response) => {

            response.rows.forEach((element, key) => {
                position += (key + 1) + "\n";
                nickname += element.nickname + "\n",
                points += element.points + "\n"
            });

            let topPlayers = new MessageEmbed()
                .setColor('#1B47DF')
                .setTitle('Топ ладдера:')
                .addFields(
                    { name: 'Место:', value: position, inline: true },
                    { name: 'Игроки:', value: nickname, inline: true },
                    { name: 'Рейтинг:', value: points, inline: true },
                )
                .addField('Вызов игрока', '!!challenge @mention')
                .setImage('https://cs8.pikabu.ru/post_img/2017/12/10/9/1512919327129076499.jpg')
                .setTimestamp();
            message.channel.send(topPlayers);
        })
        .catch((e) => {
            console.error(e);
            message.channel.send('Ошибка базы данных...')
            Pool.end();
        });
}

module.exports.help = {
    name: 'top',
    aliases: ['топ', 'ладдер']
};