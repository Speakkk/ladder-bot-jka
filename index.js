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
