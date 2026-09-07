const { z } = require('zod');
const { EMISOR_MERCURY } = require('../../config/mercury');
const fechaVencimientoSchema = z.string().trim()
    .regex(/^(?:[0-9]{4}(?:0[1-9]|1[0-2])|(?:0[1-9]|1[0-2])\/[0-9]{4})$/, 'Usa mm/yyyy con un mes válido')
    .transform(valor => valor.includes('/') ? valor.slice(3) + valor.slice(0, 2) : valor);
const campos = {
    nombre_titular: z.string().trim().min(3, 'El nombre del titular es obligatorio').max(120),
    cvv: z.string().regex(/^[0-9]{3}$/, 'El CVV debe contener 3 dígitos'),
    fecha_vencimiento: fechaVencimientoSchema,
    monto_autorizado: z.number().nonnegative().max(9999999999.99).multipleOf(0.01),
    monto_disponible: z.number().nonnegative().max(9999999999.99).multipleOf(0.01),
    id_usuario: z.number().int().positive(),
    id_emisor: z.literal(EMISOR_MERCURY),
    estado: z.enum(['ACTIVA', 'BLOQUEADA', 'VENCIDA', 'CANCELADA'])
};
const crearTarjetaSchema = z.object({
    ...campos, id_emisor: campos.id_emisor.optional().default(EMISOR_MERCURY),
    monto_disponible: campos.monto_disponible.optional(),
    estado: campos.estado.optional().default('ACTIVA')
}).strict().refine(datos => datos.monto_disponible === undefined || datos.monto_disponible <= datos.monto_autorizado, {
    message: 'El monto disponible no puede superar al autorizado', path: ['monto_disponible']
});
const actualizarTarjetaSchema = z.object(campos).partial().strict()
    .refine(datos => Object.keys(datos).length > 0, 'Debe proporcionar al menos un campo para actualizar');
const actualizarFavoritaSchema = z.object({ favorita: z.boolean() }).strict();
module.exports = { crearTarjetaSchema, actualizarTarjetaSchema, actualizarFavoritaSchema };
