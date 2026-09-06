const autorizacionesService =
    require(
        './autorizaciones.service'
    );


const jsonFormatter =
    require(
        './formatters/json.formatter'
    );


const xmlFormatter =
    require(
        './formatters/xml.formatter'
    );


const autorizar =
    async (
        req,
        res,
        next
    ) => {

        try {

            const resultado =
                await autorizacionesService
                    .autorizar(
                        req.body,
                        req.ip
                    );


            if (
                req.body.formato ===
                'XML'
            ) {

                return res
                    .status(200)
                    .type(
                        'application/xml'
                    )
                    .send(
                        xmlFormatter(
                            resultado
                        )
                    );

            }


            return res
                .status(200)
                .json(
                    jsonFormatter(
                        resultado
                    )
                );

        } catch (error) {

            next(error);

        }

    };


module.exports = {
    autorizar
};