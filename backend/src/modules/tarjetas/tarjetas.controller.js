const tarjetasService =
    require('./tarjetas.service');


const listarTodas = async (
    req,
    res,
    next
) => {

    try {

        const tarjetas =
            await tarjetasService
                .listarTodas();


        return res.status(200).json({

            tarjetas

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

        const tarjetas =
            await tarjetasService
                .listarMias(
                    req.user.id_usuario
                );


        return res.status(200).json({

            tarjetas

        });

    } catch (error) {

        next(error);

    }
};


const obtenerPorId = async (
    req,
    res,
    next
) => {

    try {

        const tarjeta =
            await tarjetasService
                .obtenerPorId(
                    req.params.id,
                    req.user
                );


        return res.status(200).json({

            tarjeta

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

        const tarjeta =
            await tarjetasService
                .crear(
                    req.body
                );


        return res.status(201).json({

            mensaje:
                'Tarjeta creada correctamente',

            tarjeta

        });

    } catch (error) {

        next(error);

    }
};


const actualizar = async (
    req,
    res,
    next
) => {

    try {

        const tarjeta =
            await tarjetasService
                .actualizar(
                    req.params.id,
                    req.body
                );


        return res.status(200).json({

            mensaje:
                'Tarjeta actualizada correctamente',

            tarjeta

        });

    } catch (error) {

        next(error);

    }
};


const eliminar = async (
    req,
    res,
    next
) => {

    try {

        const tarjeta =
            await tarjetasService
                .cancelar(
                    req.params.id
                );


        return res.status(200).json({

            mensaje:
                'Tarjeta cancelada correctamente',

            tarjeta

        });

    } catch (error) {

        next(error);

    }
};


const actualizarFavorita = async (req, res, next) => {
    try {
        const tarjeta = await tarjetasService.actualizarFavorita(
            req.params.id,
            req.user,
            req.body.favorita
        );

        return res.status(200).json({
            mensaje: 'Preferencia de tarjeta actualizada correctamente',
            tarjeta
        });
    } catch (error) {
        next(error);
    }
};


const revelar = async (req, res, next) => {
    res.set('Cache-Control', 'no-store, private');
    res.set('Pragma', 'no-cache');
    try {
        res.json({ tarjeta: await tarjetasService.revelar(req.params.id, req.user) });
    } catch (error) { next(error); }
};

const buscar = async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try { res.json({ tarjetas: await tarjetasService.buscar(req.body.busqueda) }); }
    catch (error) { next(error); }
};

module.exports = {
    buscar,
    revelar,

    actualizarFavorita,

    listarTodas,

    listarMias,

    obtenerPorId,

    crear,

    actualizar,

    eliminar

};
