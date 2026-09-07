const db = require('../../config/db');
const listar = async () => (await db.query(
    'SELECT TRIM(id_emisor) AS id_emisor, nombre, activo FROM emisores ORDER BY nombre'
)).rows;
module.exports = { listar };
