const express =
    require('express');


const tarjetasController =
    require('./tarjetas.controller');


const authMiddleware =
    require('../../middlewares/auth.middleware');


const requireRole =
    require('../../middlewares/role.middleware');


const validate =
    require('../../middlewares/validate.middleware');


const {
    crearTarjetaSchema,
    actualizarTarjetaSchema
} = require('./tarjetas.validation');


const router =
    express.Router();


// ADMIN
router.get(
    '/',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    tarjetasController.listarTodas
);


// CLIENTE
router.get(
    '/mias',
    authMiddleware,
    requireRole('CLIENTE'),
    tarjetasController.listarMias
);


// ADMIN o CLIENTE propietario
router.get(
    '/:id',
    authMiddleware,
    tarjetasController.obtenerPorId
);


// ADMIN
router.post(
    '/',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    validate(crearTarjetaSchema),
    tarjetasController.crear
);


// ADMIN
router.put(
    '/:id',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    validate(actualizarTarjetaSchema),
    tarjetasController.actualizar
);


// ADMIN
router.delete(
    '/:id',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    tarjetasController.eliminar
);


module.exports = router;