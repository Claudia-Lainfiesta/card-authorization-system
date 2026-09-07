const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { cifrarCvv, descifrarCvv, generarNumero } = require('../src/utils/cardData');
const fs = require('node:fs');
const path = require('node:path');

test('genera 16 dígitos con prefijo Visa y dígito verificador', () => {
    const numeros = new Set();
    for (let i = 0; i < 1000; i++) {
        const numero = generarNumero();
        assert.match(numero, /^4[0-9]{15}$/);
        const suma = [...numero].reduce((sum, n, j) => {
            const v = Number(n) * (j % 2 === 0 ? 2 : 1);
            return sum + (v > 9 ? v - 9 : v);
        }, 0);
        assert.equal(suma % 10, 0);
        numeros.add(numero);
    }
    assert.equal(numeros.size, 1000);
});

test('CVV cifrado autenticado, vinculado a tarjeta y compatible con hashes históricos', () => {
    const anterior = process.env.CARD_DATA_KEY;
    process.env.CARD_DATA_KEY = randomBytes(32).toString('hex');
    try {
        const numero = generarNumero();
        const cifrado = cifrarCvv('007', numero);
        assert.equal(descifrarCvv(cifrado, numero), '007');
        assert.notEqual(cifrado, cifrarCvv('007', numero));
        assert.throws(() => descifrarCvv(cifrado, generarNumero()), { statusCode: 500 });
        assert.throws(() => descifrarCvv(cifrado.slice(0, -4) + 'AAAA', numero), { statusCode: 500 });
        assert.equal(descifrarCvv(null, numero), null);
        process.env.CARD_DATA_KEY = '';
        assert.throws(() => cifrarCvv('007', numero), { statusCode: 503 });
    } finally {
        if (anterior === undefined) delete process.env.CARD_DATA_KEY;
        else process.env.CARD_DATA_KEY = anterior;
    }
});

test('reintenta colisiones detectadas antes y durante el INSERT; falla sin sobrescribir al agotar intentos', async () => {
    let generados = 0, insertados = 0;
    const numeros = ['4000000000000001', '4000000000000002', '4000000000000003'];
    const repo = {
        buscarEmisorPorId: async () => ({ activo: true }),
        buscarPorNumero: async n => n === numeros[0] ? { id_tarjeta: 99 } : null,
        crear: async datos => {
            insertados++;
            if (insertados === 1) return null; // Otro proceso insertó el PAN entre SELECT e INSERT.
            return { id_tarjeta: 1, numero_tarjeta: datos.numeroTarjeta, id_emisor: 'MERCURY00000001' };
        },
    };
    const modulo = { exports: {} };
    const requerir = nombre => {
        if (nombre === 'bcrypt') return { hash: async () => 'hash' };
        if (nombre === './tarjetas.repository') return repo;
        if (nombre === '../usuarios/usuarios.repository') return { buscarPorId: async () => ({ activo: true }) };
        if (nombre === '../../utils/cardData') return { generarNumero: () => numeros[generados++ % 3], cifrarCvv: () => 'cifrado' };
        if (nombre === '../../config/mercury') return { EMISOR_MERCURY: 'MERCURY00000001' };
        if (nombre === '../../utils/maskCardNumber') return () => '************0003';
        throw new Error('Dependencia inesperada');
    };
    new Function('require', 'module', 'exports', fs.readFileSync(path.join(__dirname, '../src/modules/tarjetas/tarjetas.service.js'), 'utf8'))(requerir, modulo, modulo.exports);
    const r = await modulo.exports.crear({ id_usuario: 1, cvv: '123', monto_autorizado: 100 });
    assert.equal(r.id_tarjeta, 1);
    assert.equal(generados, 3);
    assert.equal(insertados, 2);
    repo.buscarPorNumero = async () => ({ id_tarjeta: 99 });
    await assert.rejects(modulo.exports.crear({ id_usuario: 1, cvv: '123' }), { statusCode: 503 });
    assert.equal(generados, 13);
    assert.equal(insertados, 2);
});
