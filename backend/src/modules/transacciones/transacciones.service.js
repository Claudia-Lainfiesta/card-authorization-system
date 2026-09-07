const transaccionesRepository =
    require('./transacciones.repository');


const maskCardNumber =
    require('../../utils/maskCardNumber');


const crearError = (
    mensaje,
    statusCode
) => {

    const error =
        new Error(mensaje);

    error.statusCode =
        statusCode;

    return error;
};


const convertirRespuesta = (
    transaccion
) => {

    return {

        id_transaccion:
            transaccion.id_transaccion,

        id_tarjeta:
            transaccion.id_tarjeta,

        numero_tarjeta:
            transaccion.numero_tarjeta
                ? maskCardNumber(
                    transaccion.numero_tarjeta
                )
                : undefined,

        nombre_titular:
            transaccion.nombre_titular,

        id_usuario:
            transaccion.id_usuario,

        propietario:
            transaccion.propietario,

        tipo:
            transaccion.tipo,

        monto:
            Number(
                transaccion.monto
            ),

        comercio:
            transaccion.comercio,

        estado:
            transaccion.estado,

        fecha:
            transaccion.fecha

    };
};


const listarTodas = async () => {

    const transacciones =
        await transaccionesRepository
            .listarTodas();


    return transacciones.map(
        convertirRespuesta
    );
};


const listarMias = async (
    idUsuario
) => {

    const transacciones =
        await transaccionesRepository
            .listarPorUsuario(
                idUsuario
            );


    return transacciones.map(
        convertirRespuesta
    );
};


const crear = async (
    datos
) => {

    return await transaccionesRepository
        .ejecutarEnTransaccion(
            async (client) => {

                const tarjeta =
                    await transaccionesRepository
                        .buscarTarjetaParaMovimiento(
                            client,
                            datos.id_tarjeta
                        );


                if (!tarjeta) {

                    throw crearError(
                        'Tarjeta no encontrada',
                        404
                    );
                }


                const monto =
                    Number(
                        datos.monto
                    );


                const saldoActual =
                    Number(
                        tarjeta.monto_disponible
                    );


                const montoAutorizado =
                    Number(
                        tarjeta.monto_autorizado
                    );


                let nuevoSaldo;


                // =========================
                // CONSUMO
                // =========================

                if (
                    datos.tipo ===
                    'CONSUMO'
                ) {

                    if (
                        tarjeta.estado !==
                        'ACTIVA'
                    ) {

                        throw crearError(
                            'La tarjeta no se encuentra activa',
                            400
                        );
                    }


                    if (
                        monto >
                        saldoActual
                    ) {

                        throw crearError(
                            'Saldo insuficiente',
                            400
                        );
                    }


                    nuevoSaldo = Math.round((saldoActual - monto) * 100) / 100;

                }


                // =========================
                // PAGO
                // =========================

                else if (
                    datos.tipo ===
                    'PAGO'
                ) {

                    if (
                        tarjeta.estado ===
                        'CANCELADA'
                    ) {

                        throw crearError(
                            'No se pueden registrar pagos en una tarjeta cancelada',
                            400
                        );
                    }


                    nuevoSaldo = Math.round((saldoActual + monto) * 100) / 100;


                    if (
                        nuevoSaldo >
                        montoAutorizado
                    ) {

                        throw crearError(
                            'El pago supera el monto autorizado de la tarjeta',
                            400
                        );
                    }

                }


                // =========================
                // REVERSO
                // =========================

                else if (
                    datos.tipo ===
                    'REVERSO'
                ) {

                    if (
                        tarjeta.estado ===
                        'CANCELADA'
                    ) {

                        throw crearError(
                            'No se pueden registrar reversos en una tarjeta cancelada',
                            400
                        );
                    }


                    nuevoSaldo = Math.round((saldoActual + monto) * 100) / 100;


                    if (
                        nuevoSaldo >
                        montoAutorizado
                    ) {

                        throw crearError(
                            'El reverso supera el monto autorizado de la tarjeta',
                            400
                        );
                    }

                }


                await transaccionesRepository
                    .actualizarSaldo(
                        client,
                        tarjeta.id_tarjeta,
                        nuevoSaldo
                    );


                const transaccion =
                    await transaccionesRepository
                        .crear(
                            client,
                            {

                                idTarjeta:
                                    tarjeta.id_tarjeta,

                                tipo:
                                    datos.tipo,

                                monto,

                                comercio:
                                    datos.comercio

                            }
                        );


                return {

                    id_transaccion:
                        transaccion.id_transaccion,

                    id_tarjeta:
                        transaccion.id_tarjeta,

                    numero_tarjeta:
                        maskCardNumber(
                            tarjeta.numero_tarjeta
                        ),

                    nombre_titular:
                        tarjeta.nombre_titular,

                    tipo:
                        transaccion.tipo,

                    monto:
                        Number(
                            transaccion.monto
                        ),

                    comercio:
                        transaccion.comercio,

                    estado:
                        transaccion.estado,

                    saldo_anterior:
                        saldoActual,

                    saldo_nuevo:
                        nuevoSaldo,

                    fecha:
                        transaccion.fecha

                };

            }
        );
};


module.exports = {

    listarTodas,

    listarMias,

    crear

};
