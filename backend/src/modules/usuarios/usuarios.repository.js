const db = require('../../config/db');


const buscarPorCorreo = async (correo) => {

    const resultado = await db.query(
        `
        SELECT
            u.id_usuario,
            u.nombre_completo,
            u.correo,
            u.password_hash,
            u.activo,
            u.fecha_creacion,
            u.ultimo_login,
            r.id_rol,
            r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r
            ON u.id_rol = r.id_rol
        WHERE LOWER(u.correo) = LOWER($1)
        LIMIT 1;
        `,
        [correo]
    );

    return resultado.rows[0];
};


const buscarPorId = async (idUsuario) => {

    const resultado = await db.query(
        `
        SELECT
            u.id_usuario,
            u.nombre_completo,
            u.correo,
            u.activo,
            u.fecha_creacion,
            u.ultimo_login,
            r.id_rol,
            r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r
            ON u.id_rol = r.id_rol
        WHERE u.id_usuario = $1
        LIMIT 1;
        `,
        [idUsuario]
    );

    return resultado.rows[0];
};


const buscarRolPorNombre = async (nombreRol) => {

    const resultado = await db.query(
        `
        SELECT
            id_rol,
            nombre
        FROM roles
        WHERE nombre = $1
        LIMIT 1;
        `,
        [nombreRol]
    );

    return resultado.rows[0];
};


const crear = async ({
    nombreCompleto,
    correo,
    passwordHash,
    idRol
}) => {

    const resultado = await db.query(
        `
        INSERT INTO usuarios (
            nombre_completo,
            correo,
            password_hash,
            id_rol
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id_usuario,
            nombre_completo,
            correo,
            id_rol,
            activo,
            fecha_creacion;
        `,
        [
            nombreCompleto,
            correo,
            passwordHash,
            idRol
        ]
    );

    return resultado.rows[0];
};


const actualizarUltimoLogin = async (idUsuario) => {

    await db.query(
        `
        UPDATE usuarios
        SET ultimo_login = NOW()
        WHERE id_usuario = $1;
        `,
        [idUsuario]
    );
};


const listarTodos = async () => {

    const resultado = await db.query(
        `
        SELECT
            u.id_usuario,
            u.nombre_completo,
            u.correo,
            u.activo,
            u.fecha_creacion,
            u.ultimo_login,
            r.nombre AS rol
        FROM usuarios u
        INNER JOIN roles r
            ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario;
        `
    );

    return resultado.rows;
};


const actualizarRol = async (
    idUsuario,
    idRol
) => {

    await db.query(
        `
        UPDATE usuarios
        SET id_rol = $2
        WHERE id_usuario = $1;
        `,
        [
            idUsuario,
            idRol
        ]
    );

    return buscarPorId(idUsuario);
};


module.exports = {

    buscarPorCorreo,

    buscarPorId,

    buscarRolPorNombre,

    crear,

    actualizarUltimoLogin,

    listarTodos,

    actualizarRol

};