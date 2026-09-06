const validate = (schema) => {

    return (req, res, next) => {

        const resultado = schema.safeParse(
            req.body
        );

        if (!resultado.success) {

            const errores =
                resultado.error.issues.map(
                    (error) => ({
                        campo:
                            error.path.join('.'),

                        mensaje:
                            error.message
                    })
                );

            return res.status(400).json({
                error: 'Datos invalidos',
                detalles: errores
            });
        }

        req.body = resultado.data;

        next();
    };
};

module.exports = validate;