const dotenv = require('dotenv');

dotenv.config();

const requiredVariables = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET'
];

for (const variable of requiredVariables) {

    if (!process.env[variable]) {

        throw new Error(
            `Falta la variable de entorno: ${variable}`
        );
    }
}

const env = {

    port: process.env.PORT || 3000,

    nodeEnv: process.env.NODE_ENV || 'development',

    database: {

        host: process.env.DB_HOST,

        port: Number(
            process.env.DB_PORT
        ),

        name: process.env.DB_NAME,

        user: process.env.DB_USER,

        password: process.env.DB_PASSWORD

    },

    jwt: {

        secret: process.env.JWT_SECRET,

        expiresIn:
            process.env.JWT_EXPIRES_IN || '15m',

        refreshSecret:
            process.env.REFRESH_TOKEN_SECRET,

        refreshExpiresIn:
            process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

    }

};

module.exports = env;