const maskCardNumber = (
    numeroTarjeta
) => {

    if (!numeroTarjeta) {

        return '';

    }

    const numero =
        numeroTarjeta.trim();


    if (numero.length !== 16) {

        return '**** **** **** ****';

    }


    return (
        numero.substring(0, 1) +
        'XXX XXXX XXXX ' +
        numero.substring(12)
    );
};


module.exports =
    maskCardNumber;