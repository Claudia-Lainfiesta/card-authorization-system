const { z } = require('zod');
const { registroSchema } = require('../auth/auth.validation');
const rol = z.enum(['ADMINISTRADOR', 'CLIENTE']);
const crearUsuarioSchema = registroSchema.extend({ rol }).strict();
const actualizarUsuarioSchema = registroSchema.omit({ password: true }).partial()
    .extend({ rol: rol.optional(), activo: z.boolean().optional() }).strict()
    .refine(datos => Object.keys(datos).length > 0, 'Debe proporcionar al menos un campo');
const cambiarRolSchema = z.object({ rol }).strict();
module.exports = { crearUsuarioSchema, actualizarUsuarioSchema, cambiarRolSchema };
