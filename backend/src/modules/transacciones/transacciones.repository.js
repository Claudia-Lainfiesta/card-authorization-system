const db =
    require('../../config/db');


const listarTodas = async () => {

    const resultado =
        await db.query(
            `
            SELECT
                tr.id_transaccion,
                tr.id_tarjeta,
                t.numero_tarjeta,
                t.nombre_titular,
                t.id_usuario,
                u.nombre_completo AS propietario,
                tr.tipo,
                tr.monto,
                tr.comercio,
                tr.estado,
                tr.fecha
            FROM transacciones tr
            INNER JOIN tarjetas t
                ON tr.id_tarjeta = t.id_tarjeta
            INNER JOIN usuarios u
                ON t.id_usuario = u.id_usuario
            ORDER BY tr.fecha DESC,
                     tr.id_transaccion DESC;
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
                tr.id_transaccion,
                tr.id_tarjeta,
                t.numero_tarjeta,
                t.nombre_titular,
                t.id_usuario,
                tr.tipo,
                tr.monto,
                tr.comercio,
                tr.estado,
                tr.fecha
            FROM transacciones tr
            INNER JOIN tarjetas t
                ON tr.id_tarjeta = t.id_tarjeta
            WHERE t.id_usuario = $1
            ORDER BY tr.fecha DESC,
                     tr.id_transaccion DESC;
            `,
            [
                idUsuario
            ]
        );


    return resultado.rows;
};


const ejecutarEnTransaccion = async (
    callback
) => {

    const client =
        await db.connect();


    try {

        await client.query(
            'BEGIN'
        );


        const resultado =
            await callback(client);


        await client.query(
            'COMMIT'
        );


        return resultado;

    } catch (error) {

        await client.query(
            'ROLLBACK'
        );


        throw error;

    } finally {

        client.release();

    }
};


const buscarTarjetaParaMovimiento = async (
    client,
    idTarjeta
) => {

    const resultado =
        await client.query(
            `
            SELECT
                id_tarjeta,
                numero_tarjeta,
                nombre_titular,
                monto_autorizado,
                monto_disponible,
                id_usuario,
                estado
            FROM tarjetas
            WHERE id_tarjeta = $1
            FOR UPDATE;
            `,
            [
                idTarjeta
            ]
        );


    return resultado.rows[0];
};


const actualizarSaldo = async (
    client,
    idTarjeta,
    nuevoSaldo
) => {

    await client.query(
        `
        UPDATE tarjetas
        SET
            monto_disponible = $2,
            fecha_actualizacion = NOW()
        WHERE id_tarjeta = $1;
        `,
        [
            idTarjeta,
            nuevoSaldo
        ]
    );
};


const crear = async (
    client,
    {
        idTarjeta,
        tipo,
        monto,
        comercio
    }
) => {

    const resultado =
        await client.query(
            `
            INSERT INTO transacciones (
                id_tarjeta,
                tipo,
                monto,
                comercio,
                estado
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                'COMPLETADA'
            )
            RETURNING
                id_transaccion,
                id_tarjeta,
                tipo,
                monto,
                comercio,
                estado,
                fecha;
            `,
            [
                idTarjeta,
                tipo,
                monto,
                comercio || null
            ]
        );


    return resultado.rows[0];
};


module.exports = {

    listarTodas,

    listarPorUsuario,

    ejecutarEnTransaccion,

    buscarTarjetaParaMovimiento,

    actualizarSaldo,

    crear

};