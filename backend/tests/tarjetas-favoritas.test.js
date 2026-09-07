const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

// Ejecuta las capas reales (ruta, middleware, validación, controlador, servicio
// y repositorio), sustituyendo únicamente la conexión y la verificación JWT.
function crearEscenario() {
    const consultas = [];
    const tarjetas = ['ACTIVA', 'BLOQUEADA', 'VENCIDA', 'CANCELADA'].map((estado, i) => ({
        id_tarjeta: i + 1,
        id_usuario: 10,
        estado,
        favorita: false,
        numero_tarjeta: '4000000000001234',
        nombre_titular: 'Cliente de prueba',
        fecha_vencimiento: '203001',
        monto_autorizado: '1000.00',
        monto_disponible: '500.00',
        id_emisor: 'EMISOR_PRUEBA_01',
        emisor: 'Emisor de prueba'
    }));
    const db = {
        async query(sql, params = []) {
            if (/FROM usuarios u/.test(sql) && /WHERE u.id_usuario = \$1/.test(sql)) {
                return { rows: [{ id_usuario: params[0], activo: true, rol: params[0] === 99 ? 'ADMINISTRADOR' : 'CLIENTE' }] };
            }
            consultas.push({ sql, params });
            if (/UPDATE tarjetas/.test(sql)) {
                assert.match(sql, /WHERE id_tarjeta = \$1 AND id_usuario = \$2/);
                assert.match(sql, /SET favorita = \$3/);
                assert.match(sql, /RETURNING id_tarjeta, favorita/);
                const tarjeta = tarjetas.find(t => t.id_tarjeta === params[0] && t.id_usuario === params[1]);
                if (!tarjeta) return { rows: [] };
                tarjeta.favorita = params[2];
                return { rows: [{ id_tarjeta: tarjeta.id_tarjeta, favorita: tarjeta.favorita }] };
            }
            if (/WHERE t.id_usuario = \$1/.test(sql)) {
                assert.match(sql, /t.favorita/);
                return { rows: tarjetas.filter(t => t.id_usuario === params[0]) };
            }
            return { rows: tarjetas };
        }
    };
    const raiz = path.resolve(__dirname, '../src');
    const cache = new Map();
    function cargar(archivo) {
        if (archivo === path.join(raiz, 'config', 'db.js')) return db;
        if (archivo === path.join(raiz, 'config', 'jwt.config.js')) {
            return {
                verificarAccessToken(token) {
                    if (token === 'cliente') return { id_usuario: 10, rol: 'CLIENTE' };
                    if (token === 'ajeno') return { id_usuario: 20, rol: 'CLIENTE' };
                    if (token === 'admin') return { id_usuario: 99, rol: 'ADMINISTRADOR' };
                    throw new Error('Token inválido');
                }
            };
        }
        if (cache.has(archivo)) return cache.get(archivo).exports;
        const modulo = { exports: {} };
        cache.set(archivo, modulo);
        const resolver = createRequire(archivo);
        const requerir = nombre => nombre.startsWith('.')
            ? cargar(resolver.resolve(nombre))
            : resolver(nombre);
        new Function('require', 'module', 'exports', fs.readFileSync(archivo, 'utf8'))(
            requerir, modulo, modulo.exports
        );
        return modulo.exports;
    }
    const router = cargar(path.join(raiz, 'modules', 'tarjetas', 'tarjetas.routes.js'));
    function pedir(method, url, token, body) {
        return new Promise((resolve, reject) => {
            const req = { method, url, headers: {}, body };
            if (token) req.headers.authorization = `Bearer ${token}`;
            const res = {
                statusCode: 200,
                status(code) { this.statusCode = code; return this; },
                json(body) { resolve({ status: this.statusCode, body }); return this; }
            };
            router.handle(req, res, error => {
                if (error) resolve({ status: error.statusCode || 500, body: { error: error.message } });
                else reject(new Error('Ruta no encontrada'));
            });
        });
    }
    return { pedir, tarjetas, consultas };
}

test('rechaza peticiones sin autenticación, tokens inválidos y administradores', async () => {
    const { pedir, consultas } = crearEscenario();
    for (const [token, status] of [[undefined, 401], ['invalido', 401], ['admin', 403]]) {
        assert.equal((await pedir('PATCH', '/1/favorita', token, { favorita: true })).status, status);
    }
    assert.equal(consultas.length, 0);
});

test('no permite cambiar tarjetas ajenas y no revela si existen', async () => {
    const { pedir, tarjetas } = crearEscenario();
    const ajena = await pedir('PATCH', '/1/favorita', 'ajeno', { favorita: true });
    const inexistente = await pedir('PATCH', '/999/favorita', 'cliente', { favorita: true });
    assert.equal(ajena.status, 404);
    assert.deepEqual(ajena, inexistente);
    assert.equal(tarjetas[0].favorita, false);
});

test('permite guardar y quitar favoritas en todos los estados, sin modificar saldos ni estado', async () => {
    const { pedir, tarjetas } = crearEscenario();
    for (const tarjeta of tarjetas) {
        const original = { ...tarjeta };
        for (const favorita of [true, true, false]) {
            const res = await pedir('PATCH', `/${tarjeta.id_tarjeta}/favorita`, 'cliente', { favorita });
            assert.equal(res.status, 200);
            assert.deepEqual(res.body.tarjeta, { id_tarjeta: tarjeta.id_tarjeta, favorita });
            assert.deepEqual(tarjeta, { ...original, favorita });
        }
    }
});

test('exige booleano y rechaza campos ajenos a la preferencia', async () => {
    const { pedir, consultas } = crearEscenario();
    for (const body of [{}, { favorita: 'true' }, { favorita: 1 }, { favorita: null },
        { favorita: true, id_usuario: 20 }, { favorita: true, monto_disponible: 9999 }]) {
        assert.equal((await pedir('PATCH', '/1/favorita', 'cliente', body)).status, 400);
    }
    assert.equal(consultas.length, 0);
});

test('rechaza identificadores inválidos antes de consultar la base', async () => {
    const { pedir, consultas } = crearEscenario();
    for (const id of ['0', '-1', '1.5', '1e2', 'abc', '9007199254740992']) {
        assert.equal((await pedir('PATCH', `/${id}/favorita`, 'cliente', { favorita: true })).status, 400);
    }
    assert.equal(consultas.length, 0);
});

test('recarga la preferencia en mias y la excluye de las respuestas del administrador', async () => {
    const { pedir } = crearEscenario();
    await pedir('PATCH', '/1/favorita', 'cliente', { favorita: true });
    const mias = await pedir('GET', '/mias', 'cliente');
    assert.equal(mias.status, 200);
    assert.equal(mias.body.tarjetas[0].favorita, true);
    assert.equal(mias.body.tarjetas[1].favorita, false);
    assert.equal(mias.body.tarjetas[0].numero_tarjeta.includes('4000000000001234'), false);
    assert.equal('cvv' in mias.body.tarjetas[0], false);
    const admin = await pedir('GET', '/', 'admin');
    assert.equal(admin.status, 200);
    assert.equal(admin.body.tarjetas.some(t => 'favorita' in t), false);
});

test('el endpoint habitual de edición no acepta favoritas como campo editable', async () => {
    const { pedir, consultas } = crearEscenario();
    const res = await pedir('PUT', '/1', 'admin', { favorita: true });
    assert.equal(res.status, 400);
    assert.equal(consultas.length, 0);
});
