const { z } =
    require('zod');


const fechaVencimientoSchema =
    z.string()
        .regex(
            /^[0-9]{6}$/,
            'La fecha debe tener formato YYYYMM'
        )
        .refine(
            (valor) => {

                const mes =
                    Number(
                        valor.substring(4, 6)
                    );

                return (
                    mes >= 1 &&
                    mes <= 12
                );

            },
            {
                message:
                    'El mes de vencimiento no es valido'
            }
        );


const crearTarjetaSchema =
    z.object({

        numero_tarjeta:
            z.string()
                .regex(
                    /^4[0-9]{15}$/,
                    'La tarjeta debe tener 16 digitos e iniciar con 4'
                ),

        nombre_titular:
            z.string()
                .trim()
                .min(
                    3,
                    'El nombre del titular es obligatorio'
                )
                .max(
                    120,
                    'El nombre del titular es demasiado largo'
                ),

        cvv:
            z.string()
                .regex(
                    /^[0-9]{3}$/,
                    'El CVV debe contener 3 digitos'
                ),

        fecha_vencimiento:
            fechaVencimientoSchema,

        monto_autorizado:
            z.number()
                .nonnegative(
                    'El monto autorizado no puede ser negativo'
                ),

        monto_disponible:
            z.number()
                .nonnegative(
                    'El monto disponible no puede ser negativo'
                ),

        id_usuario:
            z.number()
                .int()
                .positive(),

        id_emisor:
            z.string()
                .length(
                    15,
                    'El ID del emisor debe tener 15 caracteres'
                ),

        estado:
            z.enum([
                'ACTIVA',
                'BLOQUEADA',
                'VENCIDA',
                'CANCELADA'
            ])
            .optional()
            .default('ACTIVA')

    });


const actualizarTarjetaSchema =
    z.object({

        monto_autorizado:
            z.number()
                .nonnegative()
                .optional(),

        monto_disponible:
            z.number()
                .nonnegative()
                .optional(),

        estado:
            z.enum([
                'ACTIVA',
                'BLOQUEADA',
                'VENCIDA',
                'CANCELADA'
            ])
            .optional()

    })
    .refine(
        (datos) =>
            Object.keys(datos).length > 0,
        {
            message:
                'Debe proporcionar al menos un campo para actualizar'
        }
    );


module.exports = {
    crearTarjetaSchema,
    actualizarTarjetaSchema
};