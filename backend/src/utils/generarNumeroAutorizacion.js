const crypto =
    require('crypto');


const generarNumeroAutorizacion =
    () => {

        const numero =
            crypto.randomInt(
                10000000,
                100000000
            );


        return `AUT-${numero}`;

    };


module.exports =
    generarNumeroAutorizacion;