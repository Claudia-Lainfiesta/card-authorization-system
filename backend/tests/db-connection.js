const db = require('../src/config/db');

const probarConexion = async () => {

    try {

        console.log('');
        console.log('Probando conexion con PostgreSQL...');
        console.log('');

        const resultado = await db.query(
            'SELECT NOW() AS fecha_servidor'
        );

        console.log(
            'Conexion establecida correctamente'
        );

        console.log(
            'Fecha del servidor:',
            resultado.rows[0].fecha_servidor
        );

        console.log('');
        console.log('Consultando tablas...');
        console.log('');

        const tablas = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        tablas.rows.forEach((tabla) => {
            console.log(
                `- ${tabla.table_name}`
            );
        });

        console.log('');
        console.log('Consultando roles...');
        console.log('');

        const roles = await db.query(`
    SELECT id_rol, nombre
    FROM roles
    ORDER BY id_rol;
`);

        roles.rows.forEach((rol) => {
            console.log(
                `${rol.id_rol} - ${rol.nombre}`
            );
        });

        console.log('');
        console.log('Consultando emisores...');
        console.log('');

        const emisores = await db.query(`
    SELECT id_emisor, nombre, bin_prefijo
    FROM emisores;
`);

        emisores.rows.forEach((emisor) => {
            console.log(
                `${emisor.id_emisor} - ${emisor.nombre} - BIN ${emisor.bin_prefijo}`
            );
        });

    } catch (error) {

        console.error(
            'Error conectando con PostgreSQL'
        );

        console.error(error.message);

    } finally {

        await db.end();

    }
};

probarConexion();