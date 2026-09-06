const rateLimit =
    require('express-rate-limit');


const autorizacionRateLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        limit:
            30,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {

            error:
                'Demasiadas solicitudes. Intente nuevamente mas tarde.'

        }

    });


module.exports =
    autorizacionRateLimiter;