const bcrypt = require('bcrypt');
const repository = require('./usuarios.repository');
const crearError = (mensaje, statusCode) => Object.assign(new Error(mensaje), { statusCode });
const validarId = valor => {
    const id = Number(valor);
    if (!Number.isSafeInteger(id) || id <= 0) throw crearError('ID de usuario inválido', 400);
    return id;
};
const listar = () => repository.listarTodos();

const validarCorreo = async (correo, id) => {
    const existente = await repository.buscarPorCorreo(correo);
    if (existente && existente.id_usuario !== id)
        throw crearError('Ya existe un usuario registrado con ese correo', 409);
};
const obtenerRol = async nombre => {
    const rol = await repository.buscarRolPorNombre(nombre);
    if (!rol) throw crearError('Rol inválido', 400);
    return rol.id_rol;
};
const crear = async datos => {
    await validarCorreo(datos.correo);
    const idRol = await obtenerRol(datos.rol);
    const passwordHash = await bcrypt.hash(datos.password, 10);
    try {
        const usuario = await repository.crear({
            nombreCompleto: datos.nombre_completo,
            correo: datos.correo.toLowerCase(),
            passwordHash, idRol
        });
        return { ...usuario, rol: datos.rol };
    } catch (error) {
        if (error.code === '23505') throw crearError('Ya existe un usuario registrado con ese correo', 409);
        throw error;
    }
};

const actualizar = async (idUsuario, datos, solicitante) => {
    const id = validarId(idUsuario);
    if (id === solicitante.id_usuario && (datos.activo === false ||
        (datos.rol !== undefined && datos.rol !== 'ADMINISTRADOR'))) {
        throw crearError('No puedes desactivar tu cuenta ni quitarte el rol de Administrador', 403);
    }
    if (!await repository.buscarPorId(id)) throw crearError('Usuario no encontrado', 404);
    if (datos.correo) await validarCorreo(datos.correo, id);
    const idRol = datos.rol ? await obtenerRol(datos.rol) : undefined;
    try {
        const usuario = await repository.editar(id, {
            ...datos, correo: datos.correo?.toLowerCase(), id_rol: idRol
        });
        if (!usuario) throw crearError('Usuario no encontrado', 404);
        return usuario;
    } catch (error) {
        if (error.code === '23505') throw crearError('Ya existe un usuario registrado con ese correo', 409);
        throw error;
    }
};
const cambiarRol = (id, rol, solicitante) => actualizar(id, { rol }, solicitante);
const eliminar = async (idUsuario, solicitante) => {
    const id = validarId(idUsuario);
    if (id === solicitante.id_usuario) throw crearError('No puedes eliminar tu propia cuenta', 403);
    const resultado = await repository.eliminar(id);
    if (!resultado) throw crearError('Usuario no encontrado', 404);
    return resultado;
};
module.exports = { listar, crear, actualizar, cambiarRol, eliminar };
