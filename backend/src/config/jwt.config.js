const jwt = require('jsonwebtoken');

const env = require('./env');

const generarAccessToken = (usuario) => {

    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            rol: usuario.rol
        },
        env.jwt.secret,
        {
            expiresIn: env.jwt.expiresIn
        }
    );
};

const generarRefreshToken = (usuario) => {

    return jwt.sign(
        {
            id_usuario: usuario.id_usuario,
            tipo: 'refresh'
        },
        env.jwt.refreshSecret,
        {
            expiresIn: env.jwt.refreshExpiresIn
        }
    );
};

const verificarAccessToken = (token) => {

    return jwt.verify(
        token,
        env.jwt.secret
    );
};

const verificarRefreshToken = (token) => {

    return jwt.verify(
        token,
        env.jwt.refreshSecret
    );
};

module.exports = {
    generarAccessToken,
    generarRefreshToken,
    verificarAccessToken,
    verificarRefreshToken
};