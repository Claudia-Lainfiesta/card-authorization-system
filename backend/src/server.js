const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

const PORT = env.port;

const iniciarServidor = async () => {
    try {

        // Comprobar conexión con PostgreSQL
        await db.query('SELECT 1');

        console.log(
            'Conexion con PostgreSQL establecida correctamente'
        );

        app.listen(PORT, '0.0.0.0', () => {
            console.log('=================================');
            console.log(' SISTEMA DE TARJETAS');
            console.log('=================================');
            console.log(
                `Servidor ejecutandose en puerto ${PORT}`
            );
            console.log(
                `http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            'No fue posible conectar con PostgreSQL'
        );

        console.error(error.message);

        process.exit(1);
    }
};

iniciarServidor();