const express =
    require('express');


const authController =
    require('./auth.controller');


const validate =
    require('../../middlewares/validate.middleware');


const {
    registroSchema,
    loginSchema
} = require('./auth.validation');


const router =
    express.Router();


router.post(
    '/registro',
    validate(registroSchema),
    authController.registro
);


router.post(
    '/login',
    validate(loginSchema),
    authController.login
);


router.post(
    '/refresh',
    authController.refresh
);


router.post(
    '/logout',
    authController.logout
);


module.exports = router;