const db = require('../../config/db');

const resumen = async (fecha) => {
    const resultado = await db.query(`
        SELECT
            (SELECT COUNT(*)::int FROM tarjetas WHERE estado = 'ACTIVA') AS tarjetas_activas,
            (SELECT COUNT(*)::int FROM usuarios) AS usuarios_registrados,
            COUNT(*)::int AS autorizaciones_hoy,
            COUNT(*) FILTER (WHERE status = 'APROBADO')::int AS aprobadas_hoy
        FROM autorizaciones WHERE fecha = $1;
    `, [fecha]);
    return resultado.rows[0];
};
module.exports = { resumen };
