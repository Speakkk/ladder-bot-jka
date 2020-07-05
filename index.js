require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.env.TOKEN;
const prefix = process.env.PREFIX;
const db = require('pg')

const config = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 5, // max number of clients in the pool
    idleTimeoutMillis: 30000
};

let pool = new db.Pool(config);


client.on('ready', () => {
    console.log(`Запустился бот ${client.user.username}`);
    client.generateInvite(["ADMINISTRATOR"]).then(link => {
        console.log(link);
    });
});

client.on('typingStart', (channel, user) => {
    // if (channel.id === '728225173743861770') {
    //     if (user.username !== 'sppppppppppppppppppppppppppppppp') {
    //         client.channels.cache.get(channel.id).send('!ban ' + `<@${user.id}>`)
    //     }
    // }
});

client.on('message', msg => {

    let args = msg.content.split(' ');
    let command = args.shift().toLowerCase();

    if (command === prefix + 'ping') {
        msg.reply('pong!');
    }

    if (command === prefix + 'top') {
        let limit = args[0] === undefined ? 20 : args[0]
        try {
            pool.query(`SELECT t.nickname, t.points
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
                                    LIMIT ${limit};`)
                .then(resultQuery => {
                    let place = '';
                    let nickname = '';
                    let points = '';

                    resultQuery.rows.forEach((element, key) => {
                        place += key + 1 + "\n";
                        nickname += element.nickname + "\n",
                            points += element.points + "\n"
                    });

                    const exampleEmbed = new Discord.MessageEmbed()
                        .setColor('#1B47DF')
                        .setTitle('Топ ладдера:')
                        .addFields(
                            { name: 'Место:', value: place, inline: true },
                            { name: 'Игроки:', value: nickname, inline: true },
                            { name: 'Рейтинг:', value: points, inline: true },
                        )
                        .addField('Вызов игрока', '!!challenge @mention')
                        .setImage('https://cs8.pikabu.ru/post_img/2017/12/10/9/1512919327129076499.jpg')
                        .setTimestamp();
                    msg.channel.send(exampleEmbed);
                })

        } catch (err) {
            console.log(err.stack)
            msg.channel.send('Ошибка базы данных...');
            pool.end()
        }

    }

    if (command === prefix + 'register') {
        if (args[0] !== undefined) {
            try {
                const res = pool.query(`SELECT EXISTS(SELECT 1 FROM players where discord_id = '${msg.author.id}' limit 1)`);

                if (res) {
                    msg.channel.send('Вы уже в ладдере!');
                } else {
                    const query = {
                        text: 'INSERT INTO players(nickname, discord_id) VALUES($1, $2)',
                        values: [args[0], msg.author.id],
                    }
                    pool.query(query);
                    msg.channel.send('Поздравляю, вы успешно зарегистрировались в ладдере! Удачной вам игры!');
                }

            } catch (err) {
                console.log(err);
                msg.channel.send('Ошибка регистрации...');
                pool.end();
            }

        }
    }

    if (command === prefix + 'challenge') {
        if (args[0] !== undefined) {
            try {
                let discordId = /<@!(.*)>/gm.exec(args[0])[1];

                pool.query(`SELECT EXISTS(SELECT 1 FROM players where discord_id = '${msg.author.id}' limit 1)`)
                .then((result) => {
                    if(!result.rows[0].exists) {
                        msg.channel.send('Вы не можете вызвать игрока, так как вы не зарегистрированы в ладдере');
                        return false;
                    }
                    return true;
                }).then((value) => {
                    if(value === true) {
                        pool.query(`SELECT EXISTS(SELECT 1 FROM players where discord_id = '${discordId}' limit 1)`)
                        .then((result) => {
                            if(!result.rows[0].exists) {
                                msg.channel.send('Игрока которого вы вызвали нету в ладдере!');
                                return false;
                            }
                            return true;
                        }) 
                    }
                }).then((value) => {
                    if(value === true) {
                        pool.query(`SELECT ROW_NUMBER() OVER (ORDER BY t.points DESC) place, t.nickname, t.points, t.discord_id
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
                        ORDER BY t.points DESC;`)
                        .then(resultQuery => {

                            let resultFiltered = resultQuery.rows.filter(obj => {
                                return obj.discord_id === msg.author.id
                            })
                            challengeEmbed = new Discord.MessageEmbed()
                                .setColor('#1B47DF')
                                .setTitle('Вас вызвали!')
                                .setThumbnail(msg.mentions.users.first().displayAvatarURL())
                                //.setThumbnail('https://i.pinimg.com/originals/51/55/c5/5155c58d79374e7842275ab475c421a3.jpg')
                                .addFields(
                                    { name: 'Игрок:', value: resultFiltered[0].nickname, inline: true },
                                    { name: 'Рейтинг:', value: resultFiltered[0].place, inline: true },
                                )
                                .addField('Принять вызов', `!!accept <@!${msg.author.id}>`)
                                .addField('Отклонить вызов', `!!decline <@!${msg.author.id}>`)
                                .setTimestamp()
                            msg.channel.send(args[0], challengeEmbed);
                        });
                    }   
                })
            } catch (err) {
                console.log(err);
                msg.channel.send('Ошибка вызова...');
                pool.end();
            }
        }
    }
});


client.login(token).then(a => {
    console.log(a, 'discord client login')
}).catch(e => {
    console.log(e, 'discord login err')
});