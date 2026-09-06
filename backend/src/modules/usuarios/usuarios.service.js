const usuariosRepository =
    require('./usuarios.repository');


const crearError = (
    mensaje,
    statusCode
) => {

    const error = new Error(mensaje);

    error.statusCode = statusCode;

    return error;
};


const listar = async () => {

    return await usuariosRepository
        .listarTodos();
};


const cambiarRol = async (
    idUsuario,
    nombreRol
) => {

    const id = Number(idUsuario);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw crearError(
            'ID de usuario invalido',
            400
        );
    }


    const usuario =
        await usuariosRepository
            .buscarPorId(id);


    if (!usuario) {

        throw crearError(
            'Usuario no encontrado',
            404
        );
    }


    const rol =
        await usuariosRepository
            .buscarRolPorNombre(
                nombreRol
            );


    if (!rol) {

        throw crearError(
            'Rol invalido',
            400
        );
    }


    return await usuariosRepository
        .actualizarRol(
            id,
            rol.id_rol
        );
};


module.exports = {
    listar,
    cambiarRol
};