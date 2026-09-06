const transaccionesService =
    require('./transacciones.service');


const listarTodas = async (
    req,
    res,
    next
) => {

    try {

        const transacciones =
            await transaccionesService
                .listarTodas();


        return res.status(200).json({

            transacciones

        });

    } catch (error) {

        next(error);

    }
};


const listarMias = async (
    req,
    res,
    next
) => {

    try {

        const transacciones =
            await transaccionesService
                .listarMias(
                    req.user.id_usuario
                );


        return res.status(200).json({

            transacciones

        });

    } catch (error) {

        next(error);

    }
};


const crear = async (
    req,
    res,
    next
) => {

    try {

        const transaccion =
            await transaccionesService
                .crear(
                    req.body
                );


        return res.status(201).json({

            mensaje:
                'Transaccion registrada correctamente',

            transaccion

        });

    } catch (error) {

        next(error);

    }
};


module.exports = {

    listarTodas,

    listarMias,

    crear

};