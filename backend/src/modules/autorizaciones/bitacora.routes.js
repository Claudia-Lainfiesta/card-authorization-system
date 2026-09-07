const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const role = require('../../middlewares/role.middleware');
router.get('/bitacora', auth, role('ADMINISTRADOR'), require('./autorizaciones.controller').bitacora);
module.exports = router;
