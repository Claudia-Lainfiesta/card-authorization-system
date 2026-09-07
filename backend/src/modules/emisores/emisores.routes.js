const router = require('express').Router();
const auth = require('../../middlewares/auth.middleware');
const role = require('../../middlewares/role.middleware');
router.get('/', auth, role('ADMINISTRADOR'), require('./emisores.controller').listar);
module.exports = router;
