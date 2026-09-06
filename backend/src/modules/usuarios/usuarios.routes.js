const express =
    require('express');

const usuariosController =
    require('./usuarios.controller');

const authMiddleware =
    require('../../middlewares/auth.middleware');

const requireRole =
    require('../../middlewares/role.middleware');


const router =
    express.Router();


router.get(
    '/',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    usuariosController.listar
);


router.put(
    '/:id/rol',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    usuariosController.cambiarRol
);


module.exports = router;