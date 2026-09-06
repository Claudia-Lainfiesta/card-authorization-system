const {
    verificarAccessToken
} = require('../config/jwt.config');


const authMiddleware = (
    req,
    res,
    next
) => {

    const authorization =
        req.headers.authorization;


    if (!authorization) {

        return res.status(401).json({

            error:
                'Token de autenticacion requerido'

        });
    }


    const partes =
        authorization.split(' ');


    if (
        partes.length !== 2 ||
        partes[0] !== 'Bearer'
    ) {

        return res.status(401).json({

            error:
                'Formato de token invalido'

        });
    }


    const token =
        partes[1];


    try {

        const payload =
            verificarAccessToken(
                token
            );


        req.user = {

            id_usuario:
                payload.id_usuario,

            rol:
                payload.rol

        };


        next();

    } catch (error) {

        return res.status(401).json({

            error:
                'Token invalido o expirado'

        });

    }
};


module.exports = authMiddleware;