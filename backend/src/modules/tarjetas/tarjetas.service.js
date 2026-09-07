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


    // La preferencia no se incluye en las respuestas de administración.
    return tarjetas.map((tarjeta) => ({
        ...convertirTarjetaRespuesta(tarjeta),
        favorita: tarjeta.favorita
    }));
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


const { EMISOR_MERCURY } = require('../../config/mercury');
const { generarNumero, cifrarCvv, descifrarCvv } = require('../../utils/cardData');

const crear = async (datos) => {
    const usuario = await usuariosRepository.buscarPorId(datos.id_usuario);
    if (!usuario || !usuario.activo) throw crearError('El usuario propietario no existe o está inactivo', 400);
    const emisor = await tarjetasRepository.buscarEmisorPorId(EMISOR_MERCURY);
    if (!emisor || !emisor.activo) throw crearError('El emisor Mercury no está configurado', 503);
    const cvvHash = await bcrypt.hash(datos.cvv, 10);
    // El índice UNIQUE y ON CONFLICT también cubren altas simultáneas.
    for (let intento = 0; intento < 10; intento++) {
        const numero = generarNumero();
        if (await tarjetasRepository.buscarPorNumero(numero)) continue;
        const tarjeta = await tarjetasRepository.crear({
            numeroTarjeta: numero, nombreTitular: datos.nombre_titular,
            cvvHash, cvvCifrado: cifrarCvv(datos.cvv, numero),
            fechaVencimiento: datos.fecha_vencimiento,
            montoAutorizado: datos.monto_autorizado,
            montoDisponible: datos.monto_disponible ?? datos.monto_autorizado,
            idUsuario: datos.id_usuario, idEmisor: EMISOR_MERCURY, estado: datos.estado
        });
        if (tarjeta) return convertirTarjetaRespuesta(tarjeta);
    }
    throw crearError('No fue posible generar una tarjeta única. Inténtalo de nuevo', 503);
};

const revelar = async (idTarjeta, usuario) => {
    if (usuario.rol !== 'CLIENTE') throw crearError('No autorizado para este recurso', 403);
    const id = Number(idTarjeta);
    if (!Number.isSafeInteger(id) || id <= 0) throw crearError('ID de tarjeta inválido', 400);
    const tarjeta = await tarjetasRepository.datosPropios(id, usuario.id_usuario);
    if (!tarjeta) throw crearError('Tarjeta no encontrada', 404);
    const numero = tarjeta.numero_tarjeta.trim();
    return { id_tarjeta: id, numero_tarjeta: numero, cvv: descifrarCvv(tarjeta.cvv_cifrado, numero) };
};

const actualizar = async (idTarjeta, datos) => {
    const id = Number(idTarjeta);
    if (!Number.isSafeInteger(id) || id <= 0) throw crearError('ID de tarjeta inválido', 400);
    const cvvHash = datos.cvv ? await bcrypt.hash(datos.cvv, 10) : undefined;
    try {
        await tarjetasRepository.ejecutar(async client => {
            if (datos.id_usuario !== undefined) {
                const propietario = await tarjetasRepository.bloquearPropietario(client, datos.id_usuario);
                if (!propietario || !propietario.activo) throw crearError('El usuario propietario no existe o está inactivo', 400);
            }
            const actual = await tarjetasRepository.bloquearParaEdicion(client, id);
            if (!actual) throw crearError('Tarjeta no encontrada', 404);
            if (datos.estado === 'ACTIVA' && datos.id_usuario === undefined) {
                const propietario = await usuariosRepository.buscarPorId(actual.id_usuario);
                if (!propietario || !propietario.activo) throw crearError('No se puede activar una tarjeta de un usuario inactivo', 400);
            }
            if (datos.id_emisor !== undefined && datos.id_emisor !== actual.id_emisor.trim()) {
                const emisor = await tarjetasRepository.buscarEmisorPorId(datos.id_emisor);
                if (!emisor || !emisor.activo) throw crearError('El emisor no existe o está inactivo', 400);
            }
            // El bloqueo evita perder consumos concurrentes. Cálculos en centavos.
            const utilizado = Math.round(Number(actual.monto_autorizado) * 100) - Math.round(Number(actual.monto_disponible) * 100);
            const autorizado = Math.round(Number(datos.monto_autorizado ?? actual.monto_autorizado) * 100);
            if (autorizado < utilizado) throw crearError('El monto autorizado no puede ser menor al monto ya utilizado', 400);
            const disponible = (autorizado - utilizado) / 100;
            if (datos.monto_disponible !== undefined && Math.round(datos.monto_disponible * 100) !== autorizado - utilizado)
                throw crearError('El disponible se calcula conservando el monto ya utilizado', 400);
            await tarjetasRepository.actualizarDetalle(client, id, {
                ...datos, id_emisor: EMISOR_MERCURY, cvv_hash: cvvHash,
                cvv_cifrado: datos.cvv ? cifrarCvv(datos.cvv, actual.numero_tarjeta.trim()) : undefined,
                monto_autorizado: autorizado / 100, monto_disponible: disponible
            });
        });
        return convertirTarjetaRespuesta(await tarjetasRepository.buscarPorId(id));
    } catch (error) {
        if (error.code === '23505') throw crearError('La tarjeta ya se encuentra registrada', 409);
        throw error;
    }
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


const actualizarFavorita = async (idTarjeta, usuarioSolicitante, favorita) => {
    if (usuarioSolicitante.rol !== 'CLIENTE') {
        throw crearError('No autorizado para este recurso', 403);
    }

    const id = Number(idTarjeta);
    if (!/^[1-9][0-9]*$/.test(String(idTarjeta)) || !Number.isSafeInteger(id)) {
        throw crearError('ID de tarjeta invalido', 400);
    }
    if (typeof favorita !== 'boolean') {
        throw crearError('La preferencia favorita debe ser un booleano', 400);
    }

    // Comprobación de propiedad y escritura atómicas: nunca modifica otra tarjeta.
    const tarjeta = await tarjetasRepository.actualizarFavorita(
        id,
        usuarioSolicitante.id_usuario,
        favorita
    );
    if (!tarjeta) {
        throw crearError('Tarjeta no encontrada', 404);
    }
    return tarjeta;
};


const buscar = async (busqueda) => {
    const texto = /^[\d\s-]+$/.test(busqueda) ? busqueda.replace(/[\s-]/g, '') : busqueda;
    const tarjetas = await tarjetasRepository.listarTodas(texto, 20);
    return tarjetas.map(convertirTarjetaRespuesta);
};

module.exports = {
    buscar,
    revelar,

    actualizarFavorita,

    listarTodas,

    listarMias,

    obtenerPorId,

    crear,

    actualizar,

    cancelar

};
