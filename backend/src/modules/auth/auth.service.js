const bcrypt = require('bcrypt');

const usuariosRepository =
    require('../usuarios/usuarios.repository');

const {
    generarAccessToken,
    generarRefreshToken,
    verificarRefreshToken
} = require('../../config/jwt.config');


const crearError = (
    mensaje,
    statusCode
) => {

    const error = new Error(mensaje);

    error.statusCode = statusCode;

    return error;
};


const registrar = async ({
    nombre_completo,
    correo,
    password
}) => {

    // Verificar si el correo ya existe
    const usuarioExistente =
        await usuariosRepository.buscarPorCorreo(
            correo
        );

    if (usuarioExistente) {

        throw crearError(
            'Ya existe un usuario registrado con ese correo',
            409
        );
    }


    // Buscar el rol CLIENTE
    const rolCliente =
        await usuariosRepository.buscarRolPorNombre(
            'CLIENTE'
        );

    if (!rolCliente) {

        throw crearError(
            'El rol CLIENTE no existe en la base de datos',
            500
        );
    }


    // Hashear contraseña
    const passwordHash =
        await bcrypt.hash(
            password,
            10
        );


    // Crear usuario
    const nuevoUsuario =
        await usuariosRepository.crear({

            nombreCompleto:
                nombre_completo,

            correo:
                correo.toLowerCase(),

            passwordHash,

            idRol:
                rolCliente.id_rol

        });


    return {

        id_usuario:
            nuevoUsuario.id_usuario,

        nombre_completo:
            nuevoUsuario.nombre_completo,

        correo:
            nuevoUsuario.correo,

        rol:
            rolCliente.nombre,

        activo:
            nuevoUsuario.activo,

        fecha_creacion:
            nuevoUsuario.fecha_creacion

    };

};


const login = async ({
    correo,
    password
}) => {

    const usuario =
        await usuariosRepository.buscarPorCorreo(
            correo
        );


    if (!usuario) {

        throw crearError(
            'Correo o contraseña incorrectos',
            401
        );
    }


    if (!usuario.activo) {

        throw crearError(
            'El usuario se encuentra inactivo',
            403
        );
    }


    const passwordValida =
        await bcrypt.compare(
            password,
            usuario.password_hash
        );


    if (!passwordValida) {

        throw crearError(
            'Correo o contraseña incorrectos',
            401
        );
    }


    const accessToken =
        generarAccessToken(usuario);


    const refreshToken =
        generarRefreshToken(usuario);


    await usuariosRepository
        .actualizarUltimoLogin(
            usuario.id_usuario
        );


    return {

        usuario: {

            id_usuario:
                usuario.id_usuario,

            nombre_completo:
                usuario.nombre_completo,

            correo:
                usuario.correo,

            rol:
                usuario.rol

        },

        accessToken,

        refreshToken

    };

};


const refrescarSesion = async (
    refreshToken
) => {

    if (!refreshToken) {

        throw crearError(
            'Refresh token no proporcionado',
            401
        );
    }


    let payload;

    try {

        payload =
            verificarRefreshToken(
                refreshToken
            );

    } catch (error) {

        throw crearError(
            'Refresh token invalido o expirado',
            401
        );
    }


    if (payload.tipo !== 'refresh') {

        throw crearError(
            'Token invalido',
            401
        );
    }


    const usuario =
        await usuariosRepository.buscarPorId(
            payload.id_usuario
        );


    if (!usuario) {

        throw crearError(
            'Usuario no encontrado',
            401
        );
    }


    if (!usuario.activo) {

        throw crearError(
            'El usuario se encuentra inactivo',
            403
        );
    }


    const accessToken =
        generarAccessToken(usuario);


    return {
        accessToken
    };

};


const perfil = async (idUsuario) => {
    const usuario = await usuariosRepository.buscarPorId(idUsuario);
    if (!usuario) throw crearError('Usuario no encontrado', 404);
    return { id_usuario: usuario.id_usuario, nombre_completo: usuario.nombre_completo,
        correo: usuario.correo, rol: usuario.rol, activo: usuario.activo };
};

module.exports = {
    perfil,
    registrar,
    login,
    refrescarSesion
};
