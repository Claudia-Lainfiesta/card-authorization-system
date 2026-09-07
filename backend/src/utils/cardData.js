const { randomBytes, randomInt, createCipheriv, createDecipheriv } = require('node:crypto');

const obtenerClave = () => {
    const valor = process.env.CARD_DATA_KEY;
    if (!valor || !/^[a-f0-9]{64}$/i.test(valor)) {
        throw Object.assign(new Error('El almacenamiento cifrado de tarjetas no está configurado'), { statusCode: 503 });
    }
    return Buffer.from(valor, 'hex');
};

const cifrarCvv = (cvv, numero) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', obtenerClave(), iv);
    cipher.setAAD(Buffer.from(numero));
    const cifrado = Buffer.concat([cipher.update(cvv, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), cifrado.toString('base64')].join('.');
};

const descifrarCvv = (valor, numero) => {
    if (!valor) return null; // Los hashes anteriores no se pueden recuperar.
    const clave = obtenerClave();
    try {
        const [version, iv, tag, datos] = valor.split('.');
        if (version !== 'v1') throw new Error();
        const decipher = createDecipheriv('aes-256-gcm', clave, Buffer.from(iv, 'base64'));
        decipher.setAAD(Buffer.from(numero));
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        const cvv = Buffer.concat([decipher.update(Buffer.from(datos, 'base64')), decipher.final()]).toString('utf8');
        if (!/^\d{3}$/.test(cvv)) throw new Error();
        return cvv;
    } catch {
        throw Object.assign(new Error('No fue posible revelar los datos de la tarjeta'), { statusCode: 500 });
    }
};

const generarNumero = () => {
    let numero = '4';
    for (let i = 0; i < 14; i++) numero += randomInt(10);
    const suma = [...numero].reduce((total, digito, i) => {
        const valor = Number(digito) * (i % 2 === 0 ? 2 : 1);
        return total + (valor > 9 ? valor - 9 : valor);
    }, 0);
    return numero + ((10 - suma % 10) % 10);
};

module.exports = { cifrarCvv, descifrarCvv, generarNumero };
