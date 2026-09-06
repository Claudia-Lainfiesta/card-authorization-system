const authService =
    require('./auth.service');

const env =
    require('../../config/env');


const configurarCookieRefresh = (
    res,
    refreshToken
) => {

    res.cookie(
        'refreshToken',
        refreshToken,
        {
            httpOnly: true,

            secure:
                env.nodeEnv ===
                'production',

            sameSite:
                'strict',

            maxAge:
                7 * 24 * 60 * 60 * 1000
        }
    );
};


const registro = async (
    req,
    res,
    next
) => {

    try {

        const usuario =
            await authService.registrar(
                req.body
            );


        return res.status(201).json({

            mensaje:
                'Usuario registrado correctamente',

            usuario

        });

    } catch (error) {

        next(error);

    }
};


const login = async (
    req,
    res,
    next
) => {

    try {

        const resultado =
            await authService.login(
                req.body
            );


        configurarCookieRefresh(
            res,
            resultado.refreshToken
        );


        return res.status(200).json({

            mensaje:
                'Inicio de sesion correcto',

            usuario:
                resultado.usuario,

            accessToken:
                resultado.accessToken

        });

    } catch (error) {

        next(error);

    }
};


const refresh = async (
    req,
    res,
    next
) => {

    try {

        const refreshToken =
            req.cookies.refreshToken;


        const resultado =
            await authService
                .refrescarSesion(
                    refreshToken
                );


        return res.status(200).json({

            accessToken:
                resultado.accessToken

        });

    } catch (error) {

        next(error);

    }
};


const logout = async (
    req,
    res
) => {

    res.clearCookie(
        'refreshToken',
        {
            httpOnly: true,

            secure:
                env.nodeEnv ===
                'production',

            sameSite:
                'strict'
        }
    );


    return res.status(200).json({

        mensaje:
            'Sesion cerrada correctamente'

    });
};


module.exports = {
    registro,
    login,
    refresh,
    logout
};