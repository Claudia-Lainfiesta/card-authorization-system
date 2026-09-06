const express =
    require('express');


const autorizacionesController =
    require(
        './autorizaciones.controller'
    );


const validate =
    require(
        '../../middlewares/validate.middleware'
    );


const apiKeyMiddleware =
    require(
        '../../middlewares/apiKey.middleware'
    );


const autorizacionRateLimiter =
    require(
        '../../middlewares/rateLimiter.middleware'
    );


const {
    autorizacionSchema
} = require(
    './autorizaciones.validation'
);


const router =
    express.Router();


router.post(
    '/autorizacion',

    autorizacionRateLimiter,

    validate(
        autorizacionSchema
    ),

    apiKeyMiddleware,

    autorizacionesController
        .autorizar
);


module.exports =
    router;