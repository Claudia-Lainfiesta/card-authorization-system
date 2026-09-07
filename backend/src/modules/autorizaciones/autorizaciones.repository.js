const db =
    require('../../config/db');


const ejecutar =
    async (
        callback
    ) => {

        const client =
            await db.connect();


        try {

            await client.query(
                'BEGIN'
            );


            const resultado =
                await callback(
                    client
                );


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


const buscarTarjetaPorNumero =
    async (
        client,
        numeroTarjeta
    ) => {

        const resultado =
            await client.query(
                `
                SELECT
                    id_tarjeta,
                    numero_tarjeta,
                    nombre_titular,
                    cvv_hash,
                    fecha_vencimiento,
                    monto_autorizado,
                    monto_disponible,
                    id_usuario,
                    id_emisor,
                    estado
                FROM tarjetas
                WHERE numero_tarjeta = $1
                LIMIT 1
                FOR UPDATE;
                `,
                [
                    numeroTarjeta
                ]
            );


        return resultado.rows[0];

    };


const registrarAutorizacion =
    async (
        client,
        datos
    ) => {

        const resultado =
            await client.query(
                `
                INSERT INTO autorizaciones (
                    numero_autorizacion,
                    id_tarjeta,
                    numero_tarjeta_enmascarado,
                    monto,
                    tienda,
                    status,
                    motivo_denegacion,
                    formato_solicitado,
                    fecha,
                    hora,
                    ip_origen
                )
                VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10,
                    $11
                )
                RETURNING
                    id_autorizacion;
                `,
                [
                    datos.numeroAutorizacion,
                    datos.idTarjeta,
                    datos.numeroTarjetaEnmascarado,
                    datos.monto,
                    datos.tienda,
                    datos.status,
                    datos.motivoDenegacion,
                    datos.formato,
                    datos.fecha,
                    datos.hora,
                    datos.ipOrigen
                ]
            );


        return resultado.rows[0];

    };


const actualizarSaldo =
    async (
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


const registrarConsumo =
    async (
        client,
        {
            idTarjeta,
            monto,
            tienda
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
                    'CONSUMO',
                    $2,
                    $3,
                    'COMPLETADA'
                )
                RETURNING
                    id_transaccion;
                `,
                [
                    idTarjeta,
                    monto,
                    tienda
                ]
            );


        return resultado.rows[0];

    };


const existeNumeroAutorizacion =
    async (
        client,
        numero
    ) => {

        const resultado =
            await client.query(
                `
                SELECT
                    1
                FROM autorizaciones
                WHERE numero_autorizacion = $1
                LIMIT 1;
                `,
                [
                    numero
                ]
            );


        return (
            resultado.rowCount > 0
        );

    };


const bitacora = async (limit, offset) => {
    // Cuenta y página en una sola instantánea, incluso si la página queda vacía.
    const resultado = await db.query(`
        SELECT (SELECT COUNT(*)::int FROM autorizaciones) AS total,
            COALESCE((SELECT json_agg(p) FROM (
                SELECT id_autorizacion, fecha, hora, tienda, monto, status
                FROM autorizaciones
                ORDER BY fecha DESC, hora DESC, id_autorizacion DESC
                LIMIT $1 OFFSET $2
            ) p), '[]'::json) AS autorizaciones;
    `, [limit, offset]);
    return resultado.rows[0];
};

module.exports = {
    bitacora,

    ejecutar,

    buscarTarjetaPorNumero,

    registrarAutorizacion,

    actualizarSaldo,

    registrarConsumo,

    existeNumeroAutorizacion

};
