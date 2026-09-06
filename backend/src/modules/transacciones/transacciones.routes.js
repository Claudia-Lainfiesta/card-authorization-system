const express =
    require('express');


const transaccionesController =
    require('./transacciones.controller');


const authMiddleware =
    require('../../middlewares/auth.middleware');


const requireRole =
    require('../../middlewares/role.middleware');


const validate =
    require('../../middlewares/validate.middleware');


const {
    crearTransaccionSchema
} = require('./transacciones.validation');


const router =
    express.Router();


// ===============================
// HISTORIAL DEL CLIENTE
// ===============================

router.get(
    '/mias',
    authMiddleware,
    requireRole('CLIENTE'),
    transaccionesController.listarMias
);


// ===============================
// TODAS LAS TRANSACCIONES
// ===============================

router.get(
    '/',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    transaccionesController.listarTodas
);


// ===============================
// REGISTRAR TRANSACCION
// ===============================

router.post(
    '/',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    validate(
        crearTransaccionSchema
    ),
    transaccionesController.crear
);


module.exports = router;