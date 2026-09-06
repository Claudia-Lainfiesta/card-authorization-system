const bcrypt =
    require('bcrypt');


const db =
    require('../config/db');


const apiKeyMiddleware =
    async (
        req,
        res,
        next
    ) => {

        try {

            const apiKey =
                req.get(
                    'X-API-Key'
                );


            const tiendaHeader =
                req.get(
                    'X-Tienda'
                );


            if (
                !apiKey ||
                !tiendaHeader
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            'Credenciales del comercio requeridas'

                    });

            }


            if (
                !req.body.tienda ||
                tiendaHeader !==
                    req.body.tienda
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            'La tienda no coincide con las credenciales'

                    });

            }


            const resultado =
                await db.query(
                    `
                    SELECT
                        id_comercio,
                        tienda,
                        api_key_hash,
                        activo
                    FROM comercios
                    WHERE tienda = $1
                    LIMIT 1;
                    `,
                    [
                        tiendaHeader
                    ]
                );


            const comercio =
                resultado.rows[0];


            if (
                !comercio ||
                !comercio.activo
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            'Comercio no autorizado'

                    });

            }


            const apiKeyValida =
                await bcrypt.compare(
                    apiKey,
                    comercio.api_key_hash
                );


            if (!apiKeyValida) {

                return res
                    .status(401)
                    .json({

                        error:
                            'API Key invalida'

                    });

            }


            req.comercio = {

                id_comercio:
                    comercio.id_comercio,

                tienda:
                    comercio.tienda

            };


            next();

        } catch (error) {

            next(error);

        }

    };


module.exports =
    apiKeyMiddleware;