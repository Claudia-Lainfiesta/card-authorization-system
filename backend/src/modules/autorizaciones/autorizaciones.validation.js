const { z } =
    require('zod');


const autorizacionSchema =
    z.object({

        tarjeta:
            z.string()
                .min(
                    1,
                    'La tarjeta es obligatoria'
                ),

        nombre:
            z.string()
                .trim()
                .min(
                    1,
                    'El nombre es obligatorio'
                ),

        fecha_venc:
            z.string()
                .min(
                    1,
                    'La fecha de vencimiento es obligatoria'
                ),

        num_seguridad:
            z.string()
                .min(
                    1,
                    'El numero de seguridad es obligatorio'
                ),

        monto:
            z.number()
                .positive(
                    'El monto debe ser mayor que cero'
                ),

        tienda:
            z.string()
                .trim()
                .min(
                    1,
                    'La tienda es obligatoria'
                )
                .max(120),

        formato:
            z.enum([
                'JSON',
                'XML'
            ])

    });


module.exports = {
    autorizacionSchema
};