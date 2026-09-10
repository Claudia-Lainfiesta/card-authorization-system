const bcrypt =
    require('bcrypt');


const autorizacionesRepository =
    require('./autorizaciones.repository');


const maskCardNumber =
    require('../../utils/maskCardNumber');


const generarNumeroAutorizacion =
    require(
        '../../utils/generarNumeroAutorizacion'
    );


const {
    obtenerFechaHora
} = require(
    '../../utils/formatDate'
);


const normalizarNombre =
    (nombre) => {

        return nombre
            .trim()
            .replace(
                /\s+/g,
                ' '
            )
            .toUpperCase();

    };


const generarNumeroUnico =
    async (
        client
    ) => {

        for (
            let intento = 0;
            intento < 10;
            intento++
        ) {

            const numero =
                generarNumeroAutorizacion();


            const existe =
                await autorizacionesRepository
                    .existeNumeroAutorizacion(
                        client,
                        numero
                    );


            if (!existe) {

                return numero;

            }

        }


        throw new Error(
            'No fue posible generar un numero de autorizacion unico'
        );

    };


const autorizar =
    async (
        datos,
        ipOrigen
    ) => {

        return await autorizacionesRepository
            .ejecutar(
                async (
                    client
                ) => {

                    const {
                        fecha,
                        hora,
                        periodo
                    } =
                        obtenerFechaHora();


                    const numeroEnmascarado =
                        maskCardNumber(
                            datos.tarjeta
                        );


                    const denegar =
                        async (
                            motivo,
                            tarjeta = null
                        ) => {

                            await autorizacionesRepository
                                .registrarAutorizacion(
                                    client,
                                    {

                                        numeroAutorizacion:
                                            '0',

                                        idTarjeta:
                                            tarjeta
                                                ? tarjeta.id_tarjeta
                                                : null,

                                        numeroTarjetaEnmascarado:
                                            numeroEnmascarado,

                                        monto:
                                            datos.monto,

                                        tienda:
                                            datos.tienda,

                                        status:
                                            'DENEGADO',

                                        motivoDenegacion:
                                            motivo,

                                        formato:
                                            datos.formato,

                                        fecha,

                                        hora,

                                        ipOrigen

                                    }
                                );


                            return {

                                emisor:
                                    tarjeta.id_emisor,

                                status:
                                    'DENEGADO',

                                numero_autorizacion:
                                    '0',

                                motivo,

                                fecha,

                                hora,

                                tienda:
                                    datos.tienda

                            };

                        };


                    // ============================
                    // REGLA 1
                    // FORMATO DE TARJETA
                    // ============================

                    if (
                        !/^4[0-9]{15}$/
                            .test(
                                datos.tarjeta
                            )
                    ) {

                        return await denegar(
                            'FORMATO_INVALIDO'
                        );

                    }


                    // ============================
                    // REGLA 2
                    // EXISTENCIA
                    // ============================

                    const tarjeta =
                        await autorizacionesRepository
                            .buscarTarjetaPorNumero(
                                client,
                                datos.tarjeta
                            );


                    if (!tarjeta) {

                        return await denegar(
                            'TARJETA_NO_EXISTE'
                        );

                    }


                    // ============================
                    // REGLA 3
                    // TITULAR
                    // ============================
                    console.log('DEBUG TITULAR:', {
                        recibido: datos.nombre,
                        registrado: tarjeta.nombre_titular,
                        recibidoNormalizado: normalizarNombre(datos.nombre),
                        registradoNormalizado: normalizarNombre(tarjeta.nombre_titular),
                        longitudRecibido: datos.nombre.length,
                        longitudRegistrado: tarjeta.nombre_titular.length
                    });
                    if (
                        normalizarNombre(
                            datos.nombre
                        ) !==
                        normalizarNombre(
                            tarjeta.nombre_titular
                        )


                    ) {

                        return await denegar(
                            'DATOS_NO_COINCIDEN',
                            tarjeta
                        );

                    }


                    // ============================
                    // REGLA 4
                    // VENCIMIENTO
                    // ============================

                    const vencimientoRegistrado =
                        tarjeta
                            .fecha_vencimiento
                            .trim();


                    if (
                        datos.fecha_venc !==
                        vencimientoRegistrado ||
                        vencimientoRegistrado <
                        periodo
                    ) {

                        return await denegar(
                            'TARJETA_VENCIDA',
                            tarjeta
                        );

                    }


                    // ============================
                    // REGLA 5
                    // CVV
                    // ============================

                    const cvvValido =
                        await bcrypt.compare(
                            datos.num_seguridad,
                            tarjeta.cvv_hash
                        );


                    if (!cvvValido) {

                        return await denegar(
                            'CVV_INVALIDO',
                            tarjeta
                        );

                    }


                    // ============================
                    // REGLA 6
                    // ESTADO
                    // ============================

                    if (
                        tarjeta.estado !==
                        'ACTIVA'
                    ) {

                        return await denegar(
                            'TARJETA_BLOQUEADA',
                            tarjeta
                        );

                    }


                    // ============================
                    // REGLA 7
                    // SALDO
                    // ============================

                    const saldo =
                        Number(
                            tarjeta.monto_disponible
                        );


                    const monto =
                        Number(
                            datos.monto
                        );


                    if (
                        monto >
                        saldo
                    ) {

                        return await denegar(
                            'SALDO_INSUFICIENTE',
                            tarjeta
                        );

                    }


                    // ============================
                    // REGLA 8
                    // APROBAR
                    // ============================

                    const numeroAutorizacion =
                        await generarNumeroUnico(
                            client
                        );


                    const nuevoSaldo =
                        saldo -
                        monto;


                    await autorizacionesRepository
                        .actualizarSaldo(
                            client,
                            tarjeta.id_tarjeta,
                            nuevoSaldo
                        );


                    await autorizacionesRepository
                        .registrarConsumo(
                            client,
                            {

                                idTarjeta:
                                    tarjeta.id_tarjeta,

                                monto,

                                tienda:
                                    datos.tienda

                            }
                        );


                    await autorizacionesRepository
                        .registrarAutorizacion(
                            client,
                            {

                                numeroAutorizacion,

                                idTarjeta:
                                    tarjeta.id_tarjeta,

                                numeroTarjetaEnmascarado:
                                    numeroEnmascarado,

                                monto,

                                tienda:
                                    datos.tienda,

                                status:
                                    'APROBADO',

                                motivoDenegacion:
                                    null,

                                formato:
                                    datos.formato,

                                fecha,

                                hora,

                                ipOrigen

                            }
                        );


                    return {

                        emisor:
                            tarjeta.id_emisor,
                        status:
                            'APROBADO',

                        numero_autorizacion:
                            numeroAutorizacion,

                        fecha,

                        hora,

                        monto,

                        tienda:
                            datos.tienda

                    };

                }
            );

    };


const bitacora = async (query) => {
    const limit = Number(query.limit ?? 10);
    const pagina = Number(query.pagina ?? 1);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
        !Number.isSafeInteger(pagina) || pagina < 1 ||
        !Number.isSafeInteger((pagina - 1) * limit)) {
        const error = new Error('Paginación inválida');
        error.statusCode = 400;
        throw error;
    }
    const resultado = await autorizacionesRepository.bitacora(limit, (pagina - 1) * limit);
    return { ...resultado, pagina, limit };
};

module.exports = {
    bitacora,
    autorizar
};
