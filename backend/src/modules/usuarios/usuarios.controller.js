const service = require('./usuarios.service');
const listar = async (req, res, next) => {
    try { res.json({ usuarios: await service.listar() }); } catch (error) { next(error); }
};
const crear = async (req, res, next) => {
    try { res.status(201).json({ mensaje: 'Usuario creado correctamente', usuario: await service.crear(req.body) }); }
    catch (error) { next(error); }
};
const actualizar = async (req, res, next) => {
    try { res.json({ mensaje: 'Usuario actualizado correctamente', usuario: await service.actualizar(req.params.id, req.body, req.user) }); }
    catch (error) { next(error); }
};
const cambiarRol = async (req, res, next) => {
    try { res.json({ mensaje: 'Rol actualizado correctamente', usuario: await service.cambiarRol(req.params.id, req.body.rol, req.user) }); }
    catch (error) { next(error); }
};
const eliminar = async (req, res, next) => {
    try { res.json({ mensaje: 'Usuario desactivado y tarjetas canceladas correctamente', ...await service.eliminar(req.params.id, req.user) }); }
    catch (error) { next(error); }
};
module.exports = { listar, crear, actualizar, cambiarRol, eliminar };
