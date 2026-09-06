require('dotenv').config();

const bcrypt =
    require('bcrypt');

const db =
    require('../src/config/db');


const crearComercioDemo =
    async () => {

        try {

            const apiKey =
                process.env
                    .DEMO_COMERCIO_API_KEY;


            if (!apiKey) {

                throw new Error(
                    'Falta DEMO_COMERCIO_API_KEY en .env'
                );

            }


            const apiKeyHash =
                await bcrypt.hash(
                    apiKey,
                    10
                );


            await db.query(
                `
                INSERT INTO comercios (
                    tienda,
                    api_key_hash,
                    activo
                )
                VALUES (
                    $1,
                    $2,
                    TRUE
                )
                ON CONFLICT (tienda)
                DO UPDATE SET
                    api_key_hash =
                        EXCLUDED.api_key_hash,
                    activo = TRUE;
                `,
                [
                    'TIENDA_DEMO_01',
                    apiKeyHash
                ]
            );


            console.log('');
            console.log(
                'Comercio creado correctamente'
            );

            console.log(
                'Tienda: TIENDA_DEMO_01'
            );

            console.log('');

        } catch (error) {

            console.error(
                'Error creando comercio:'
            );

            console.error(
                error.message
            );

        } finally {

            await db.end();

        }

    };


crearComercioDemo();