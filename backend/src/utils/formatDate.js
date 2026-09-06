const dosDigitos = (
    numero
) => {

    return String(numero)
        .padStart(2, '0');

};


const obtenerFechaHora =
    () => {

        const ahora =
            new Date();


        const anio =
            ahora.getFullYear();


        const mes =
            dosDigitos(
                ahora.getMonth() + 1
            );


        const dia =
            dosDigitos(
                ahora.getDate()
            );


        const horas =
            dosDigitos(
                ahora.getHours()
            );


        const minutos =
            dosDigitos(
                ahora.getMinutes()
            );


        return {

            fecha:
                `${anio}${mes}${dia}`,

            hora:
                `${horas}:${minutos}`,

            periodo:
                `${anio}${mes}`

        };

    };


module.exports = {
    obtenerFechaHora
};