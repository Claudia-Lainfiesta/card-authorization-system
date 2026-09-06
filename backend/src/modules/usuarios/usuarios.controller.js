const usuariosService =
    require('./usuarios.service');


const listar = async (
    req,
    res,
    next
) => {

    try {

        const usuarios =
            await usuariosService.listar();


        return res.status(200).json({

            usuarios

        });

    } catch (error) {

        next(error);

    }
};


const cambiarRol = async (
    req,
    res,
    next
) => {

    try {

        const usuario =
            await usuariosService
                .cambiarRol(
                    req.params.id,
                    req.body.rol
                );


        return res.status(200).json({

            mensaje:
                'Rol actualizado correctamente',

            usuario

        });

    } catch (error) {

        next(error);

    }
};


module.exports = {
    listar,
    cambiarRol
};