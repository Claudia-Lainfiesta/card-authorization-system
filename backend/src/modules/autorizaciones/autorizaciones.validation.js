const {
    z
} =
    require('zod');


const autorizacionSchema =
    z.object({

        tarjeta:
            z
                .string()
                .min(
                    1,
                    'La tarjeta es obligatoria'
                ),

        nombre:
            z
                .string()
                .min(
                    1,
                    'El nombre es obligatorio'
                ),

        fecha_venc:
            z
                .string()
                .min(
                    1,
                    'La fecha de vencimiento es obligatoria'
                ),

        num_seguridad:
            z
                .string()
                .min(
                    1,
                    'El numero de seguridad es obligatorio'
                ),

        monto:
            z.coerce
                .number()
                .positive(
                    'El monto debe ser mayor que cero'
                ),

        tienda:
            z
                .string()
                .min(
                    1,
                    'La tienda es obligatoria'
                ),

        formato:
            z
                .string()
                .transform(
                    valor =>
                        valor.toUpperCase()
                )
                .refine(
                    valor =>
                        valor === 'JSON' ||
                        valor === 'XML',
                    {
                        message:
                            'El formato debe ser JSON o XML'
                    }
                )

    });


module.exports = {
    autorizacionSchema
};