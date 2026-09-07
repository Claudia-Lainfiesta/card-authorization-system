const { z } = require('zod');
const fechaVencimientoSchema = z.string().regex(/^[0-9]{4}(0[1-9]|1[0-2])$/, 'La fecha debe tener formato YYYYMM con un mes válido');
const campos = {
    numero_tarjeta: z.string().regex(/^4[0-9]{15}$/, 'La tarjeta debe tener 16 dígitos e iniciar con 4'),
    nombre_titular: z.string().trim().min(3, 'El nombre del titular es obligatorio').max(120),
    cvv: z.string().regex(/^[0-9]{3}$/, 'El CVV debe contener 3 dígitos'),
    fecha_vencimiento: fechaVencimientoSchema,
    monto_autorizado: z.number().nonnegative().max(9999999999.99).multipleOf(0.01),
    monto_disponible: z.number().nonnegative().max(9999999999.99).multipleOf(0.01),
    id_usuario: z.number().int().positive(),
    id_emisor: z.string().trim().length(15),
    estado: z.enum(['ACTIVA', 'BLOQUEADA', 'VENCIDA', 'CANCELADA'])
};
const crearTarjetaSchema = z.object({
    ...campos, estado: campos.estado.optional().default('ACTIVA')
}).strict().refine(datos => datos.monto_disponible <= datos.monto_autorizado, {
    message: 'El monto disponible no puede superar al autorizado', path: ['monto_disponible']
});
const actualizarTarjetaSchema = z.object(campos).partial().strict()
    .refine(datos => Object.keys(datos).length > 0, 'Debe proporcionar al menos un campo para actualizar');
const actualizarFavoritaSchema = z.object({ favorita: z.boolean() }).strict();
module.exports = { crearTarjetaSchema, actualizarTarjetaSchema, actualizarFavoritaSchema };
