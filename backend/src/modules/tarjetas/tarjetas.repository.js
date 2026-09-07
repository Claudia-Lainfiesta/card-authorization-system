const db =
    require('../../config/db');


const listarTodas = async (busqueda = '', limite = null) => {

    const resultado =
        await db.query(
            `
            SELECT
                t.id_tarjeta,
                t.numero_tarjeta,
                t.nombre_titular,
                t.fecha_vencimiento,
                t.monto_autorizado,
                t.monto_disponible,
                t.id_usuario,
                u.nombre_completo AS propietario,
                t.id_emisor,
                e.nombre AS emisor,
                t.estado,
                t.fecha_creacion,
                t.fecha_actualizacion
            FROM tarjetas t
            INNER JOIN usuarios u
                ON t.id_usuario = u.id_usuario
            INNER JOIN emisores e
                ON t.id_emisor = e.id_emisor
            WHERE $1 = '' OR t.numero_tarjeta::text LIKE '%' || $1 || '%'
                OR t.nombre_titular ILIKE '%' || $1 || '%'
                OR u.nombre_completo ILIKE '%' || $1 || '%'
            ORDER BY t.id_tarjeta
            LIMIT $2;
            `,
            [busqueda, limite]
        );

    return resultado.rows;
};


const listarPorUsuario = async (
    idUsuario
) => {

    const resultado =
        await db.query(
            `
            SELECT
                t.id_tarjeta,
                t.numero_tarjeta,
                t.nombre_titular,
                t.fecha_vencimiento,
                t.monto_autorizado,
                t.monto_disponible,
                t.id_usuario,
                u.nombre_completo AS propietario,
                t.id_emisor,
                e.nombre AS emisor,
                t.estado,
                t.favorita,
                t.fecha_creacion,
                t.fecha_actualizacion
            FROM tarjetas t
            INNER JOIN usuarios u
                ON t.id_usuario = u.id_usuario
            INNER JOIN emisores e
                ON t.id_emisor = e.id_emisor
            WHERE t.id_usuario = $1
            ORDER BY t.id_tarjeta;
            `,
            [
                idUsuario
            ]
        );

    return resultado.rows;
};


const buscarPorId = async (
    idTarjeta
) => {

    const resultado =
        await db.query(
            `
            SELECT
                t.id_tarjeta,
                t.numero_tarjeta,
                t.nombre_titular,
                t.fecha_vencimiento,
                t.monto_autorizado,
                t.monto_disponible,
                t.id_usuario,
                u.nombre_completo AS propietario,
                t.id_emisor,
                e.nombre AS emisor,
                t.estado,
                t.fecha_creacion,
                t.fecha_actualizacion
            FROM tarjetas t
            INNER JOIN usuarios u
                ON t.id_usuario = u.id_usuario
            INNER JOIN emisores e
                ON t.id_emisor = e.id_emisor
            WHERE t.id_tarjeta = $1
            LIMIT 1;
            `,
            [
                idTarjeta
            ]
        );

    return resultado.rows[0];
};


const buscarPorNumero = async (
    numeroTarjeta
) => {

    const resultado =
        await db.query(
            `
            SELECT id_tarjeta
            FROM tarjetas
            WHERE numero_tarjeta = $1
            LIMIT 1;
            `,
            [
                numeroTarjeta
            ]
        );

    return resultado.rows[0];
};


const buscarEmisorPorId = async (
    idEmisor
) => {

    const resultado =
        await db.query(
            `
            SELECT
                id_emisor,
                nombre,
                activo
            FROM emisores
            WHERE id_emisor = $1
            LIMIT 1;
            `,
            [
                idEmisor
            ]
        );

    return resultado.rows[0];
};


const crear = async ({
    numeroTarjeta, nombreTitular, cvvHash, cvvCifrado, fechaVencimiento,
    montoAutorizado, montoDisponible, idUsuario, idEmisor, estado
}) => {
    try {
        const id = await ejecutar(async client => {
            const propietario = await bloquearPropietario(client, idUsuario);
            if (!propietario || !propietario.activo) {
                throw Object.assign(new Error('El usuario propietario no existe o está inactivo'), { statusCode: 400 });
            }
            const resultado = await client.query(`
                INSERT INTO tarjetas (
                    numero_tarjeta, nombre_titular, cvv_hash, fecha_vencimiento,
                    monto_autorizado, monto_disponible, id_usuario, id_emisor, estado, cvv_cifrado
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                ON CONFLICT (numero_tarjeta) DO NOTHING
                RETURNING id_tarjeta;
            `, [numeroTarjeta, nombreTitular, cvvHash, fechaVencimiento,
                montoAutorizado, montoDisponible, idUsuario, idEmisor, estado, cvvCifrado]);
            return resultado.rows[0]?.id_tarjeta;
        });
        return id ? buscarPorId(id) : null;
    } catch (error) {
        if (error.code === '23505') {
            throw Object.assign(new Error('La tarjeta ya se encuentra registrada'), { statusCode: 409 });
        }
        throw error;
    }
};


const actualizar = async (
    idTarjeta,
    {
        montoAutorizado,
        montoDisponible,
        estado
    }
) => {

    await db.query(
        `
        UPDATE tarjetas
        SET
            monto_autorizado = $2,
            monto_disponible = $3,
            estado = $4,
            fecha_actualizacion = NOW()
        WHERE id_tarjeta = $1;
        `,
        [
            idTarjeta,
            montoAutorizado,
            montoDisponible,
            estado
        ]
    );


    return buscarPorId(
        idTarjeta
    );
};


const cancelar = async (
    idTarjeta
) => {

    await db.query(
        `
        UPDATE tarjetas
        SET
            estado = 'CANCELADA',
            fecha_actualizacion = NOW()
        WHERE id_tarjeta = $1;
        `,
        [
            idTarjeta
        ]
    );


    return buscarPorId(
        idTarjeta
    );
};


const actualizarFavorita = async (idTarjeta, idUsuario, favorita) => {
    const resultado = await db.query(
        `
        UPDATE tarjetas
        SET favorita = $3
        WHERE id_tarjeta = $1 AND id_usuario = $2
        RETURNING id_tarjeta, favorita;
        `,
        [idTarjeta, idUsuario, favorita]
    );

    return resultado.rows[0];
};


const ejecutar = require('../../utils/transaction');
const bloquearParaEdicion = async (client, id) => {
    const resultado = await client.query(
        'SELECT id_tarjeta, numero_tarjeta, monto_autorizado, monto_disponible, id_usuario, id_emisor FROM tarjetas WHERE id_tarjeta = $1 FOR UPDATE', [id]
    );
    return resultado.rows[0];
};
const bloquearPropietario = async (client, id) => {
    const resultado = await client.query('SELECT activo FROM usuarios WHERE id_usuario = $1 FOR SHARE', [id]);
    return resultado.rows[0];
};
const actualizarDetalle = async (client, id, datos) => {
    await client.query(`
        UPDATE tarjetas SET
            numero_tarjeta = COALESCE($2, numero_tarjeta),
            nombre_titular = COALESCE($3, nombre_titular),
            fecha_vencimiento = COALESCE($4, fecha_vencimiento),
            cvv_hash = COALESCE($5, cvv_hash),
            cvv_cifrado = COALESCE($11, cvv_cifrado),
            monto_autorizado = $6, monto_disponible = $7,
            id_usuario = COALESCE($8, id_usuario),
            id_emisor = COALESCE($9, id_emisor),
            estado = COALESCE($10, estado),
            favorita = CASE WHEN $8 IS NOT NULL AND $8 <> id_usuario THEN FALSE ELSE favorita END,
            fecha_actualizacion = NOW()
        WHERE id_tarjeta = $1;
    `, [id, datos.numero_tarjeta ?? null, datos.nombre_titular ?? null,
        datos.fecha_vencimiento ?? null, datos.cvv_hash ?? null,
        datos.monto_autorizado, datos.monto_disponible, datos.id_usuario ?? null,
        datos.id_emisor ?? null, datos.estado ?? null, datos.cvv_cifrado ?? null]);
};

const datosPropios = async (id, idUsuario) => {
    const resultado = await db.query(
        'SELECT id_tarjeta, numero_tarjeta, cvv_cifrado FROM tarjetas WHERE id_tarjeta = $1 AND id_usuario = $2',
        [id, idUsuario]
    );
    return resultado.rows[0];
};

module.exports = {
    datosPropios,
    ejecutar,
    bloquearParaEdicion,
    bloquearPropietario,
    actualizarDetalle,

    actualizarFavorita,

    listarTodas,

    listarPorUsuario,

    buscarPorId,

    buscarPorNumero,

    buscarEmisorPorId,

    crear,

    actualizar,

    cancelar

};
