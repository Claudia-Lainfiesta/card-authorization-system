const errorMiddleware = (
    error,
    req,
    res,
    next
) => {

    console.error(error);


    const statusCode =
        error.statusCode || 500;


    const mensaje =
        error.statusCode
            ? error.message
            : 'Error interno del servidor';


    return res
        .status(statusCode)
        .json({
            error: mensaje
        });
};


module.exports =
    errorMiddleware;