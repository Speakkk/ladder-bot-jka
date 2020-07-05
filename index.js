require('dotenv').config()

const Discord = require('discord.js');
const client = new Discord.Client();
const token = process.env.TOKEN;
const prefix = process.env.PREFIX;
const db = require('pg')
const fs = require("fs");
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

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

fs.readdir("./commands/", (err, files) => {
    if (err) console.log(err);
    let jsfile = files.filter((f) => f.split(".").pop() === "js");
    if (jsfile.length <= 0) {
        console.log("Couldn't find commands.");
        return;
    }
    jsfile.forEach((f) => {
        let props = require(`./commands/${f}`);
        console.log(`${f} loaded!`);
        client.commands.set(props.help.name, props);
        props.help.aliases.forEach((alias) => {
            client.aliases.set(alias, props.help.name);
        });
    });
});

client.on('ready', () => {
    console.log(`Запустился бот ${client.user.username}`);
    client.generateInvite(["ADMINISTRATOR"]).then(link => {
        console.log(link);
    });
});

client.on('message', async message => {

    if (message.author.bot) return;
    if (message.channel.type === "dm") return;

    let args = message.content
        .slice(process.env.PREFIX.length)
        .trim()
        .split(/ +/g);
    let cmd = args.shift().toLowerCase();

    let commandFile;
    client.uId = message.author.id;

    if (client.commands.has(cmd)) {
        commandFile = client.commands.get(cmd);
    } else if (client.aliases.has(cmd)) {
        commandFile = client.commands.get(client.aliases.get(cmd));
    }

    try {
        commandFile.execute(client, message, args);
    } catch (err) {
       // console.log(err);
    }
});


client.login(token);


    // if (command === prefix + 'challenge') {
    //     if (args[0] !== undefined) {
    //         try {
    //             let discordId = /<@!(.*)>/gm.exec(args[0])[1];

    //             pool.query(`SELECT EXISTS(SELECT 1 FROM players where discord_id = '${msg.author.id}' limit 1)`)
    //             .then((result) => {
    //                 if(!result.rows[0].exists) {
    //                     msg.channel.send('Вы не можете вызвать игрока, так как вы не зарегистрированы в ладдере');
    //                     return false;
    //                 }
    //                 return true;
    //             }).then((value) => {
    //                 if(value === true) {
    //                     pool.query(`SELECT EXISTS(SELECT 1 FROM players where discord_id = '${discordId}' limit 1)`)
    //                     .then((result) => {
    //                         if(!result.rows[0].exists) {
    //                             msg.channel.send('Игрока которого вы вызвали нету в ладдере!');
    //                             return false;
    //                         }
    //                         return true;
    //                     }) 
    //                 }
    //             }).then((value) => {
    //                 if(value === true) {
    //                     pool.query(`SELECT ROW_NUMBER() OVER (ORDER BY t.points DESC) place, t.nickname, t.points, t.discord_id
    //                     FROM (
    //                             SELECT DISTINCT ON
    //                                 (hm.player_id, p.nickname)
    //                                 p.id,
    //                                 p.nickname,
    //                                 p.discord_id,
    //                                 CASE
    //                                 WHEN hm.points IS NULL
    //                                     THEN 1000
    //                                     ELSE hm.points
    //                                 END
    //                             FROM history_matches hm
    //                             RIGHT JOIN players p ON p.id = hm.player_id
    //                             ORDER BY p.nickname, hm.player_id, hm.date DESC
    //                                     ) t
    //                     ORDER BY t.points DESC;`)
    //                     .then(resultQuery => {

    //                         let resultFiltered = resultQuery.rows.filter(obj => {
    //                             return obj.discord_id === msg.author.id
    //                         })
    //                         challengeEmbed = new Discord.MessageEmbed()
    //                             .setColor('#1B47DF')
    //                             .setTitle('Вас вызвали!')
    //                             .setThumbnail(msg.mentions.users.first().displayAvatarURL())
    //                             //.setThumbnail('https://i.pinimg.com/originals/51/55/c5/5155c58d79374e7842275ab475c421a3.jpg')
    //                             .addFields(
    //                                 { name: 'Игрок:', value: resultFiltered[0].nickname, inline: true },
    //                                 { name: 'Рейтинг:', value: resultFiltered[0].place, inline: true },
    //                             )
    //                             .addField('Принять вызов', `!!accept <@!${msg.author.id}>`)
    //                             .addField('Отклонить вызов', `!!decline <@!${msg.author.id}>`)
    //                             .setTimestamp()
    //                         msg.channel.send(args[0], challengeEmbed);
    //                     });
    //                 }   
    //             })
    //         } catch (err) {
    //             console.log(err);
    //             msg.channel.send('Ошибка вызова...');
    //             pool.end();
    //         }
    //     }
    // }
