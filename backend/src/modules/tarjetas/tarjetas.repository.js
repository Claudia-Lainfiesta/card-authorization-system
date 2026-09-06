const db =
    require('../../config/db');


const listarTodas = async () => {

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
            ORDER BY t.id_tarjeta;
            `
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
    numeroTarjeta,
    nombreTitular,
    cvvHash,
    fechaVencimiento,
    montoAutorizado,
    montoDisponible,
    idUsuario,
    idEmisor,
    estado
}) => {

    const resultado =
        await db.query(
            `
            INSERT INTO tarjetas (
                numero_tarjeta,
                nombre_titular,
                cvv_hash,
                fecha_vencimiento,
                monto_autorizado,
                monto_disponible,
                id_usuario,
                id_emisor,
                estado
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9
            )
            RETURNING id_tarjeta;
            `,
            [
                numeroTarjeta,
                nombreTitular,
                cvvHash,
                fechaVencimiento,
                montoAutorizado,
                montoDisponible,
                idUsuario,
                idEmisor,
                estado
            ]
        );


    return buscarPorId(
        resultado.rows[0].id_tarjeta
    );
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


module.exports = {

    listarTodas,

    listarPorUsuario,

    buscarPorId,

    buscarPorNumero,

    buscarEmisorPorId,

    crear,

    actualizar,

    cancelar

};