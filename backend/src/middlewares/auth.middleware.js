const { verificarAccessToken } = require('../config/jwt.config');
const usuariosRepository = require('../modules/usuarios/usuarios.repository');

const authMiddleware = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return res.status(401).json({ error: 'Token de autenticacion requerido' });
    const partes = authorization.split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer')
        return res.status(401).json({ error: 'Formato de token invalido' });
    let payload;
    try { payload = verificarAccessToken(partes[1]); }
    catch { return res.status(401).json({ error: 'Token invalido o expirado' }); }
    try {
        // Los cambios de rol y las desactivaciones también afectan sesiones ya abiertas.
        const usuario = await usuariosRepository.buscarPorId(payload.id_usuario);
        if (!usuario || !usuario.activo)
            return res.status(403).json({ error: 'El usuario no existe o se encuentra inactivo' });
        req.user = { id_usuario: usuario.id_usuario, rol: usuario.rol };
        next();
    } catch (error) { next(error); }
};
module.exports = authMiddleware;
