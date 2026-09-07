const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const role = require('../../middlewares/role.middleware');
const controller = require('./reportes.controller');
router.get('/resumen', auth, role('ADMINISTRADOR'), controller.resumen);
module.exports = router;
