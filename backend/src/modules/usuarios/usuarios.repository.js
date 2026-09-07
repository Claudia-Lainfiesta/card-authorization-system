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


const editar = async (id, datos) => {
    const resultado = await db.query(`
        UPDATE usuarios SET
            nombre_completo = COALESCE($2, nombre_completo),
            correo = COALESCE($3, correo),
            id_rol = COALESCE($4, id_rol),
            activo = COALESCE($5, activo)
        WHERE id_usuario = $1 RETURNING id_usuario;
    `, [id, datos.nombre_completo ?? null, datos.correo ?? null, datos.id_rol ?? null, datos.activo ?? null]);
    return resultado.rowCount ? buscarPorId(id) : null;
};

const eliminar = async (id) => require('../../utils/transaction')(async client => {
    const usuario = await client.query(
        'UPDATE usuarios SET activo = FALSE WHERE id_usuario = $1 RETURNING id_usuario', [id]
    );
    if (!usuario.rowCount) return null;
    const tarjetas = await client.query(`
        UPDATE tarjetas SET estado = 'CANCELADA', fecha_actualizacion = NOW()
        WHERE id_usuario = $1 AND estado IS DISTINCT FROM 'CANCELADA'
        RETURNING id_tarjeta;
    `, [id]);
    return { id_usuario: id, tarjetas_canceladas: tarjetas.rowCount };
});

module.exports = {
    editar,
    eliminar,

    buscarPorCorreo,

    buscarPorId,

    buscarRolPorNombre,

    crear,

    actualizarUltimoLogin,

    listarTodos,

    actualizarRol

};
