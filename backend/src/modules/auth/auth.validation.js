const { z } = require('zod');


const registroSchema = z.object({

    nombre_completo: z
        .string()
        .trim()
        .min(
            3,
            'El nombre debe tener al menos 3 caracteres'
        )
        .max(
            120,
            'El nombre es demasiado largo'
        ),

    correo: z
        .string()
        .trim()
        .email(
            'El correo no tiene un formato valido'
        )
        .max(
            150,
            'El correo es demasiado largo'
        ),

    password: z
        .string()
        .min(
            8,
            'La contraseña debe tener al menos 8 caracteres'
        )
        .max(
            100,
            'La contraseña es demasiado larga'
        )

});


const loginSchema = z.object({

    correo: z
        .string()
        .trim()
        .email(
            'El correo no tiene un formato valido'
        ),

    password: z
        .string()
        .min(
            1,
            'La contraseña es obligatoria'
        )

});


module.exports = {
    registroSchema,
    loginSchema
};