const autorizacionesService =
    require('./autorizaciones.service');

const {
    autorizacionSchema
} =
    require('./autorizaciones.validation');

const {
    create
} =
    require('xmlbuilder2');


const autorizar =
    async (
        req,
        res,
        next
    ) => {

        try {

            // ========================================
            // VALIDAR PARAMETROS DE LA URL
            // ========================================

            const validacion =
                autorizacionSchema
                    .safeParse(
                        req.query
                    );


            if (
                !validacion.success
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            'Datos invalidos',

                        detalles:
                            validacion
                                .error
                                .issues
                                .map(
                                    error => ({

                                        campo:
                                            error.path.join(
                                                '.'
                                            ),

                                        mensaje:
                                            error.message

                                    })
                                )

                    });

            }


            const datos =
                validacion.data;


            // ========================================
            // MOTOR DE AUTORIZACION
            // ========================================

            const resultado =
                await autorizacionesService
                    .autorizar(
                        datos,
                        req.ip
                    );


            // ========================================
            // CREAR RESPUESTA
            // ========================================

            const respuesta = {

                emisor:
                    resultado.emisor ||
                    '',

                tarjeta:
                    datos.tarjeta,

                status:
                    resultado.status,

                numero:
                    resultado.status ===
                    'APROBADO'
                        ?
                        resultado.numero_autorizacion
                        :
                        '0'

            };


            // ========================================
            // XML
            // ========================================

            if (
                datos.formato ===
                'XML'
            ) {

                const xml =
                    create({
                        version:
                            '1.0'
                    })
                        .ele(
                            'autorizacion'
                        )

                        .ele(
                            'emisor'
                        )
                        .txt(
                            respuesta.emisor
                        )
                        .up()

                        .ele(
                            'tarjeta'
                        )
                        .txt(
                            respuesta.tarjeta
                        )
                        .up()

                        .ele(
                            'status'
                        )
                        .txt(
                            respuesta.status
                        )
                        .up()

                        .ele(
                            'numero'
                        )
                        .txt(
                            respuesta.numero
                        )
                        .up()

                        .end({
                            prettyPrint:
                                true
                        });


                return res
                    .type(
                        'application/xml'
                    )
                    .send(
                        xml
                    );

            }


            // ========================================
            // JSON
            // ========================================

            return res.json({

                autorizacion:
                    respuesta

            });

        }
        catch (
            error
        ) {

            next(
                error
            );

        }

    };


const bitacora = async (req, res, next) => {
    try { res.json(await autorizacionesService.bitacora(req.query)); }
    catch (error) { next(error); }
};

module.exports = {
    bitacora,
    autorizar
};
