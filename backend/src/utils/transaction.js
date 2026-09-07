const db = require('../config/db');
module.exports = async (callback) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const resultado = await callback(client);
        await client.query('COMMIT');
        return resultado;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally { client.release(); }
};
