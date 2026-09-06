const bcrypt =
    require('bcrypt');


const tarjetasRepository =
    require('./tarjetas.repository');


const usuariosRepository =
    require('../usuarios/usuarios.repository');


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


const convertirTarjetaRespuesta = (
    tarjeta
) => {

    if (!tarjeta) {

        return null;

    }


    return {

        id_tarjeta:
            tarjeta.id_tarjeta,

        numero_tarjeta:
            maskCardNumber(
                tarjeta.numero_tarjeta
            ),

        nombre_titular:
            tarjeta.nombre_titular,

        fecha_vencimiento:
            tarjeta.fecha_vencimiento,

        monto_autorizado:
            Number(
                tarjeta.monto_autorizado
            ),

        monto_disponible:
            Number(
                tarjeta.monto_disponible
            ),

        id_usuario:
            tarjeta.id_usuario,

        propietario:
            tarjeta.propietario,

        id_emisor:
            tarjeta.id_emisor.trim(),

        emisor:
            tarjeta.emisor,

        estado:
            tarjeta.estado,

        fecha_creacion:
            tarjeta.fecha_creacion,

        fecha_actualizacion:
            tarjeta.fecha_actualizacion

    };
};


const listarTodas = async () => {

    const tarjetas =
        await tarjetasRepository
            .listarTodas();


    return tarjetas.map(
        convertirTarjetaRespuesta
    );
};


const listarMias = async (
    idUsuario
) => {

    const tarjetas =
        await tarjetasRepository
            .listarPorUsuario(
                idUsuario
            );


    return tarjetas.map(
        convertirTarjetaRespuesta
    );
};


const obtenerPorId = async (
    idTarjeta,
    usuarioSolicitante
) => {

    const id =
        Number(idTarjeta);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw crearError(
            'ID de tarjeta invalido',
            400
        );
    }


    const tarjeta =
        await tarjetasRepository
            .buscarPorId(id);


    if (!tarjeta) {

        throw crearError(
            'Tarjeta no encontrada',
            404
        );
    }


    if (
        usuarioSolicitante.rol === 'CLIENTE' &&
        tarjeta.id_usuario !==
            usuarioSolicitante.id_usuario
    ) {

        throw crearError(
            'No autorizado para consultar esta tarjeta',
            403
        );
    }


    return convertirTarjetaRespuesta(
        tarjeta
    );
};


const crear = async (
    datos
) => {

    const tarjetaExistente =
        await tarjetasRepository
            .buscarPorNumero(
                datos.numero_tarjeta
            );


    if (tarjetaExistente) {

        throw crearError(
            'La tarjeta ya se encuentra registrada',
            409
        );
    }


    const usuario =
        await usuariosRepository
            .buscarPorId(
                datos.id_usuario
            );


    if (!usuario) {

        throw crearError(
            'El usuario propietario no existe',
            404
        );
    }


    const emisor =
        await tarjetasRepository
            .buscarEmisorPorId(
                datos.id_emisor
            );


    if (!emisor) {

        throw crearError(
            'El emisor no existe',
            404
        );
    }


    if (!emisor.activo) {

        throw crearError(
            'El emisor se encuentra inactivo',
            400
        );
    }


    const cvvHash =
        await bcrypt.hash(
            datos.cvv,
            10
        );


    const tarjeta =
        await tarjetasRepository.crear({

            numeroTarjeta:
                datos.numero_tarjeta,

            nombreTitular:
                datos.nombre_titular,

            cvvHash,

            fechaVencimiento:
                datos.fecha_vencimiento,

            montoAutorizado:
                datos.monto_autorizado,

            montoDisponible:
                datos.monto_disponible,

            idUsuario:
                datos.id_usuario,

            idEmisor:
                datos.id_emisor,

            estado:
                datos.estado

        });


    return convertirTarjetaRespuesta(
        tarjeta
    );
};


const actualizar = async (
    idTarjeta,
    datos
) => {

    const id =
        Number(idTarjeta);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw crearError(
            'ID de tarjeta invalido',
            400
        );
    }


    const tarjetaActual =
        await tarjetasRepository
            .buscarPorId(id);


    if (!tarjetaActual) {

        throw crearError(
            'Tarjeta no encontrada',
            404
        );
    }


    const tarjeta =
        await tarjetasRepository
            .actualizar(
                id,
                {

                    montoAutorizado:
                        datos.monto_autorizado ??
                        Number(
                            tarjetaActual.monto_autorizado
                        ),

                    montoDisponible:
                        datos.monto_disponible ??
                        Number(
                            tarjetaActual.monto_disponible
                        ),

                    estado:
                        datos.estado ??
                        tarjetaActual.estado

                }
            );


    return convertirTarjetaRespuesta(
        tarjeta
    );
};


const cancelar = async (
    idTarjeta
) => {

    const id =
        Number(idTarjeta);


    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        throw crearError(
            'ID de tarjeta invalido',
            400
        );
    }


    const tarjetaActual =
        await tarjetasRepository
            .buscarPorId(id);


    if (!tarjetaActual) {

        throw crearError(
            'Tarjeta no encontrada',
            404
        );
    }


    const tarjeta =
        await tarjetasRepository
            .cancelar(id);


    return convertirTarjetaRespuesta(
        tarjeta
    );
};


module.exports = {

    listarTodas,

    listarMias,

    obtenerPorId,

    crear,

    actualizar,

    cancelar

};