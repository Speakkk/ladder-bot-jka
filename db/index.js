const { Pool } = require('pg')

const config = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 5, // max number of clients in the pool
    idleTimeoutMillis: 30000
};

const pool = new Pool(config)

module.exports = {
    query: (text, params) => {
        return pool.query(text, params)
    }
}