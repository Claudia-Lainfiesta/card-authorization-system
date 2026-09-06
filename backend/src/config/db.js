const { Pool } = require('pg');

const env = require('./env');

const pool = new Pool({
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password
});

pool.on('error', (error) => {
    console.error(
        'Error inesperado en PostgreSQL:',
        error
    );
});

module.exports = pool;