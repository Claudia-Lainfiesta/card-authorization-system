const repository = require('./reportes.repository');
const { obtenerFechaHora } = require('../../utils/formatDate');
const resumen = async () => {
    // Misma fecha local usada al registrar las autorizaciones.
    const { fecha } = obtenerFechaHora();
    const datos = await repository.resumen(fecha);
    return {
        ...datos, fecha,
        tasa_aprobacion: datos.autorizaciones_hoy
            ? Number((datos.aprobadas_hoy / datos.autorizaciones_hoy * 100).toFixed(2)) : 0
    };
};
module.exports = { resumen };
