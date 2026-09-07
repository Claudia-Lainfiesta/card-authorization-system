const express =
    require('express');

const autorizacionesController =
    require('./autorizaciones.controller');

const rateLimiter =
    require('../../middlewares/rateLimiter.middleware');


const router =
    express.Router();


router.get(
    '/',
    rateLimiter,
    autorizacionesController.autorizar
);


module.exports =
    router;