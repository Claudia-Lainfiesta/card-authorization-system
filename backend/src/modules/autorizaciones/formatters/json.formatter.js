const jsonFormatter =
    (
        resultado
    ) => {

        if (
            resultado.status ===
            'APROBADO'
        ) {

            return {

                status:
                    resultado.status,

                numero_autorizacion:
                    resultado.numero_autorizacion,

                fecha:
                    resultado.fecha,

                hora:
                    resultado.hora,

                monto:
                    resultado.monto,

                tienda:
                    resultado.tienda

            };

        }


        return {

            status:
                resultado.status,

            numero_autorizacion:
                resultado.numero_autorizacion,

            motivo:
                resultado.motivo,

            fecha:
                resultado.fecha,

            hora:
                resultado.hora,

            tienda:
                resultado.tienda

        };

    };


module.exports =
    jsonFormatter;