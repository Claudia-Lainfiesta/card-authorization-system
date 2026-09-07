const db = require('../../config/db');
const listar = async () => (await db.query(
    "SELECT TRIM(id_emisor) AS id_emisor, nombre, activo FROM emisores WHERE id_emisor = 'MERCURY00000001'"
)).rows;
module.exports = { listar };
