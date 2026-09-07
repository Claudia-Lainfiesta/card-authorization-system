const { z } =
    require('zod');


const crearTransaccionSchema =
    z.object({

        id_tarjeta:
            z.number()
                .int()
                .positive(
                    'El ID de la tarjeta debe ser valido'
                ),

        tipo:
            z.enum([
                'CONSUMO',
                'PAGO',
                'REVERSO'
            ]),

        monto:
            z.number()
                .max(9999999999.99)
                .multipleOf(0.01)
                .positive(
                    'El monto debe ser mayor que cero'
                ),

        comercio:
            z.string()
                .trim()
                .max(
                    120,
                    'El nombre del comercio es demasiado largo'
                )
                .optional()

    });


module.exports = {
    crearTransaccionSchema
};
