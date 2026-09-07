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
    actualizarFavoritaSchema,
    actualizarTarjetaSchema
} = require('./tarjetas.validation');


const router =
    express.Router();


// ADMIN
router.post('/buscar', authMiddleware, requireRole('ADMINISTRADOR'),
    validate(require('zod').z.object({ busqueda: require('zod').z.string().trim().min(1).max(120) }).strict()),
    tarjetasController.buscar);

// ADMIN
router.get(
    '/',
    authMiddleware,
    requireRole('ADMINISTRADOR'),
    tarjetasController.listarTodas
);


// CLIENTE
router.post(
    '/:id/revelar',
    authMiddleware,
    requireRole('CLIENTE'),
    tarjetasController.revelar
);

// CLIENTE
router.get(
    '/mias',
    authMiddleware,
    requireRole('CLIENTE'),
    tarjetasController.listarMias
);


// Preferencia exclusiva del cliente propietario, sin restricciones por estado.
router.patch(
    '/:id/favorita',
    authMiddleware,
    requireRole('CLIENTE'),
    validate(actualizarFavoritaSchema),
    tarjetasController.actualizarFavorita
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
