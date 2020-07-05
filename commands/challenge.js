const db = require('../db')
const { MessageEmbed } = require("discord.js");

let response;

exports.execute = (bot, message, args) => {
    if (!args.length) {
        return;
    }
    let discordId = /<@!(.*)>/gm.exec(args[0])[1];
    let query = `SELECT EXISTS(SELECT 1 FROM players where discord_id = $1 limit 1)`
    response = db.query(query, [message.author.id])
        .then((response) => {
            if (!response.rows[0].exists) {
                message.channel.send('Вы не можете вызвать игрока, так как вы не зарегистрированы в ладдере')
                return;
            }
            query = `SELECT EXISTS(SELECT 1 FROM players where discord_id = $1 limit 1)`
            response = db.query(query, [discordId])
                .then((response) => {
                    if (!response.rows[0].exists) {
                        message.channel.send('Игрока которого вы вызвали нету в ладдере!')
                        return;
                    }

                    query = `SELECT ROW_NUMBER() OVER (ORDER BY t.points DESC) place, t.nickname, t.points, t.discord_id
                                FROM (
                                        SELECT DISTINCT ON
                                            (hm.player_id, p.nickname)
                                            p.id,
                                            p.nickname,
                                            p.discord_id,
                                            CASE
                                            WHEN hm.points IS NULL
                                                THEN 1000
                                                ELSE hm.points
                                            END
                                        FROM history_matches hm
                                        RIGHT JOIN players p ON p.id = hm.player_id
                                        ORDER BY p.nickname, hm.player_id, hm.date DESC
                                                ) t
                                ORDER BY t.points DESC;`
                    response = db.query(query)
                        .then((response) => {
                            let resultFiltered = response.rows.filter(obj => {
                                return obj.discord_id === message.author.id
                            })

                            if (resultFiltered[0].discord_id === discordId) {
                                message.channel.send('Вы не можете вызвать самого себя!');
                                return;
                            }
                            challengeEmbed = new MessageEmbed()
                                .setColor('#1B47DF')
                                .setTitle('Вас вызвали!')
                                .setThumbnail(message.author.displayAvatarURL())
                                //.setThumbnail('https://i.pinimg.com/originals/51/55/c5/5155c58d79374e7842275ab475c421a3.jpg')
                                .addFields(
                                    { name: 'Игрок:', value: resultFiltered[0].nickname, inline: true },
                                    { name: 'Рейтинг:', value: resultFiltered[0].place, inline: true },
                                )
                                .addField('Принять вызов', `!!accept <@!${message.author.id}>`)
                                .addField('Отклонить вызов', `!!decline <@!${message.author.id}>`)
                                .setTimestamp()
                            message.channel.send(args[0], challengeEmbed);
                        })
                        .catch((e) => {
                            console.error(e);
                            message.channel.send('Ошибка...')
                        })
                })
                .catch((e) => {
                    console.log(e);
                    message.channel.send('Ошибка базы данных...')
                });
        })
        .catch((e) => {
            console.log(e);
            message.channel.send('Ошибка базы данных...')
        });
}

module.exports.help = {
    name: 'challenge',
    aliases: ['вызов']
};