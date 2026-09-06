const {
    create
} = require(
    'xmlbuilder2'
);


const xmlFormatter =
    (
        resultado
    ) => {

        const root =
            create({
                version:
                    '1.0',
                encoding:
                    'UTF-8'
            })
            .ele(
                'respuestaAutorizacion'
            );


        root
            .ele('status')
            .txt(
                resultado.status
            );


        root
            .ele(
                'numeroAutorizacion'
            )
            .txt(
                resultado
                    .numero_autorizacion
            );


        if (
            resultado.status ===
            'DENEGADO'
        ) {

            root
                .ele('motivo')
                .txt(
                    resultado.motivo
                );

        }


        root
            .ele('fecha')
            .txt(
                resultado.fecha
            );


        root
            .ele('hora')
            .txt(
                resultado.hora
            );


        if (
            resultado.status ===
            'APROBADO'
        ) {

            root
                .ele('monto')
                .txt(
                    resultado.monto
                        .toFixed(2)
                );

        }


        root
            .ele('tienda')
            .txt(
                resultado.tienda
            );


        return root.end({
            prettyPrint:
                true
        });

    };


module.exports =
    xmlFormatter;