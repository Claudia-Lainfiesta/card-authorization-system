const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

// Opt-in: solo PostgreSQL local. Todas las escrituras usan tablas temporales
// en una conexión aislada; no se modifican filas ni secuencias del sistema.
test('CRUD y reportes administrativos con PostgreSQL', { skip: process.env.RUN_DB_TESTS !== '1' }, async t => {
    const env = require('../src/config/env');
    assert.ok(['localhost', '127.0.0.1', '::1'].includes(env.database.host));
    assert.notEqual(env.nodeEnv, 'production');
    const { Client } = require('pg');
    const client = new Client({
        host: env.database.host, port: env.database.port, database: env.database.name,
        user: env.database.user, password: env.database.password, connectionTimeoutMillis: 5000
    });
    await client.connect();
    t.after(() => client.end());
    await client.query(`
        CREATE TEMP TABLE roles (id_rol SERIAL PRIMARY KEY, nombre TEXT UNIQUE);
        CREATE TEMP TABLE usuarios (
            id_usuario SERIAL PRIMARY KEY, nombre_completo TEXT NOT NULL, correo TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL, id_rol INTEGER REFERENCES roles(id_rol), activo BOOLEAN DEFAULT TRUE,
            fecha_creacion TIMESTAMP DEFAULT NOW(), ultimo_login TIMESTAMP
        );
        CREATE TEMP TABLE emisores (id_emisor CHAR(15) PRIMARY KEY, nombre TEXT, activo BOOLEAN DEFAULT TRUE);
        CREATE TEMP TABLE tarjetas (
            id_tarjeta SERIAL PRIMARY KEY, numero_tarjeta CHAR(16) UNIQUE NOT NULL,
            nombre_titular TEXT, cvv_hash TEXT, cvv_cifrado TEXT, fecha_vencimiento CHAR(6),
            monto_autorizado NUMERIC(12,2), monto_disponible NUMERIC(12,2),
            id_usuario INTEGER REFERENCES usuarios(id_usuario), id_emisor CHAR(15) REFERENCES emisores(id_emisor),
            estado TEXT, fecha_creacion TIMESTAMP DEFAULT NOW(), fecha_actualizacion TIMESTAMP DEFAULT NOW(),
            favorita BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE TEMP TABLE transacciones (
            id_transaccion SERIAL PRIMARY KEY, id_tarjeta INTEGER REFERENCES tarjetas(id_tarjeta),
            tipo TEXT, monto NUMERIC(12,2), comercio TEXT, estado TEXT, fecha TIMESTAMP DEFAULT NOW()
        );
        CREATE TEMP TABLE autorizaciones (
            id_autorizacion SERIAL PRIMARY KEY, fecha TEXT, hora TEXT, tienda TEXT, monto NUMERIC(12,2), status TEXT
        );
        INSERT INTO roles(nombre) VALUES ('ADMINISTRADOR'), ('CLIENTE');
        INSERT INTO usuarios(nombre_completo,correo,password_hash,id_rol) VALUES
            ('Administrador de prueba','admin@example.test','hash de prueba',1),
            ('Cliente de prueba','cliente@example.test','hash de prueba',2);
        INSERT INTO emisores(id_emisor,nombre) VALUES ('MERCURY00000001','Mercury');
    `);
    const raiz = path.resolve(__dirname, '../src');
    const cache = new Map();
    const db = { query: (...args) => client.query(...args), connect: async () => ({ query: (...args) => client.query(...args), release() {} }) };
    function cargar(archivo) {
        if (archivo === path.join(raiz, 'config', 'db.js')) return db;
        if (archivo === path.join(raiz, 'config', 'jwt.config.js')) return {
            verificarAccessToken(token) {
                if (!/^sesion-\d+$/.test(token)) throw new Error('Token inválido');
                // El rol del token es deliberadamente antiguo; manda el rol de la base.
                return { id_usuario: Number(token.slice(7)), rol: 'ADMINISTRADOR' };
            }
        };
        if (cache.has(archivo)) return cache.get(archivo).exports;
        const modulo = { exports: {} };
        cache.set(archivo, modulo);
        const resolver = createRequire(archivo);
        const requerir = nombre => nombre.startsWith('.') ? cargar(resolver.resolve(nombre)) : resolver(nombre);
        new Function('require', 'module', 'exports', fs.readFileSync(archivo, 'utf8'))(requerir, modulo, modulo.exports);
        return modulo.exports;
    }
    const routers = {
        usuarios: cargar(path.join(raiz, 'modules/usuarios/usuarios.routes.js')),
        tarjetas: cargar(path.join(raiz, 'modules/tarjetas/tarjetas.routes.js')),
        reportes: cargar(path.join(raiz, 'modules/reportes/reportes.routes.js')),
        bitacora: cargar(path.join(raiz, 'modules/autorizaciones/bitacora.routes.js')),
        transacciones: cargar(path.join(raiz, 'modules/transacciones/transacciones.routes.js')),
        auth: cargar(path.join(raiz, 'modules/auth/auth.routes.js')),
        emisores: cargar(path.join(raiz, 'modules/emisores/emisores.routes.js'))
    };
    function pedir(modulo, method, url, body, usuario = 1, query = {}) {
        return new Promise((resolve, reject) => {
            const req = { method, url, body, query, headers: usuario ? { authorization: `Bearer sesion-${usuario}` } : {} };
            const res = {
                statusCode: 200,
                headers: {},
                set(name, value) { this.headers[name] = value; return this; },
                status(code) { this.statusCode = code; return this; },
                json(body) { resolve({ status: this.statusCode, body, headers: this.headers }); return this; }
            };
            routers[modulo].handle(req, res, error => {
                if (error) resolve({ status: error.statusCode || 500, body: { error: error.message } });
                else reject(new Error('Ruta no encontrada'));
            });
        });
    }
    let nuevoUsuario;
    let tarjetaId;
    const datosTarjeta = {
        nombre_titular: 'Titular de prueba', cvv: '123',
        fecha_vencimiento: '203012', monto_autorizado: 1000, monto_disponible: 700,
        id_usuario: 2, id_emisor: 'MERCURY00000001', estado: 'ACTIVA'
    };
    await t.test('rutas restringidas al administrador actual', async () => {
        for (const [modulo, url] of [['usuarios','/'], ['tarjetas','/'], ['reportes','/resumen'], ['bitacora','/bitacora'], ['emisores','/']]) {
            assert.equal((await pedir(modulo, 'GET', url, undefined, null)).status, 401);
            assert.equal((await pedir(modulo, 'GET', url, undefined, 2)).status, 403);
        }
    });
    await t.test('métricas del día y bitácora paginada', async () => {
        let r = await pedir('reportes', 'GET', '/resumen');
        assert.equal(r.body.resumen.tasa_aprobacion, 0);
        const hoy = r.body.resumen.fecha;
        await client.query(`INSERT INTO autorizaciones(fecha,hora,tienda,monto,status) VALUES
            ($1,'10:00','Tienda 1',10,'APROBADO'),($1,'11:00','Tienda 2',20,'APROBADO'),
            ($1,'12:00','Tienda 3',30,'DENEGADO'),('20000101','09:00','Anterior',40,'DENEGADO')`, [hoy]);
        r = await pedir('reportes', 'GET', '/resumen');
        assert.equal(r.body.resumen.autorizaciones_hoy, 3);
        assert.equal(r.body.resumen.tasa_aprobacion, 66.67);
        assert.equal(r.body.resumen.usuarios_registrados, 2);
        const pagina = await pedir('bitacora', 'GET', '/bitacora', undefined, 1, { limit: '2', pagina: '2' });
        assert.equal(pagina.body.total, 4);
        assert.equal(pagina.body.autorizaciones.length, 2);
        assert.equal(pagina.body.autorizaciones[1].tienda, 'Anterior');
        assert.equal((await pedir('bitacora', 'GET', '/bitacora', undefined, 1, { limit: '0' })).status, 400);
    });
    await t.test('alta y edición de usuario con contraseña protegida y correo único', async () => {
        const datos = { nombre_completo: 'Usuario nuevo', correo: 'NUEVO@example.test', password: 'Prueba-segura-123', rol: 'ADMINISTRADOR' };
        const r = await pedir('usuarios', 'POST', '/', datos);
        assert.equal(r.status, 201);
        nuevoUsuario = r.body.usuario.id_usuario;
        assert.equal(r.body.usuario.correo, 'nuevo@example.test');
        assert.equal('password_hash' in r.body.usuario, false);
        assert.equal((await pedir('usuarios', 'POST', '/', { ...datos, correo: 'nuevo@example.test' })).status, 409);
        assert.equal((await pedir('usuarios', 'POST', '/', { ...datos, correo: 'invalido' })).status, 400);
        const hash = (await client.query('SELECT password_hash FROM usuarios WHERE id_usuario=$1', [nuevoUsuario])).rows[0].password_hash;
        assert.ok(await require('bcrypt').compare(datos.password, hash));
        assert.equal((await pedir('usuarios', 'PUT', `/${nuevoUsuario}`, { rol: 'CLIENTE' })).status, 200);
        assert.equal((await pedir('reportes', 'GET', '/resumen', undefined, nuevoUsuario)).status, 403);
        assert.equal((await pedir('usuarios', 'PUT', `/${nuevoUsuario}`, { correo: 'ADMIN@example.test' })).status, 409);
    });
    await t.test('protege al administrador autenticado en todas las rutas de modificación', async () => {
        assert.equal((await pedir('usuarios', 'PUT', '/1', { rol: 'CLIENTE' })).status, 403);
        assert.equal((await pedir('usuarios', 'PUT', '/1/rol', { rol: 'CLIENTE' })).status, 403);
        assert.equal((await pedir('usuarios', 'PUT', '/1', { activo: false })).status, 403);
        assert.equal((await pedir('usuarios', 'DELETE', '/1')).status, 403);
        assert.equal((await pedir('usuarios', 'PUT', '/1', { nombre_completo: 'Administrador actualizado' })).status, 200);
    });
    await t.test('creación de tarjeta validada y sin datos sensibles en respuestas', async () => {
        assert.equal((await pedir('tarjetas', 'POST', '/', { ...datosTarjeta, fecha_vencimiento: '203013' })).status, 400);
        assert.equal((await pedir('tarjetas', 'POST', '/', { ...datosTarjeta, monto_disponible: 1001 })).status, 400);
        const r = await pedir('tarjetas', 'POST', '/', datosTarjeta);
        assert.equal(r.status, 201);
        tarjetaId = r.body.tarjeta.id_tarjeta;
        assert.notEqual(r.body.tarjeta.numero_tarjeta, datosTarjeta.numero_tarjeta);
        assert.equal('cvv' in r.body.tarjeta, false);
        assert.equal('cvv_hash' in r.body.tarjeta, false);
        assert.equal((await pedir('tarjetas', 'POST', '/', { ...datosTarjeta, numero_tarjeta: '4000000000001234' })).status, 400);
    });
    await t.test('Mercury, fechas, datos propios sin caché y búsqueda protegida', async () => {
        const raw = (await client.query('SELECT numero_tarjeta,cvv_cifrado FROM tarjetas WHERE id_tarjeta=$1', [tarjetaId])).rows[0];
        assert.match(raw.numero_tarjeta, /^4[0-9]{15}$/);
        assert.ok(raw.cvv_cifrado.startsWith('v1.'));
        assert.equal((await pedir('tarjetas', 'POST', `/${tarjetaId}/revelar`, {}, null)).status, 401);
        assert.equal((await pedir('tarjetas', 'POST', `/${tarjetaId}/revelar`, {}, 1)).status, 403);
        assert.equal((await pedir('tarjetas', 'POST', `/${tarjetaId}/revelar`, {}, nuevoUsuario)).status, 404);
        let r = await pedir('tarjetas', 'POST', `/${tarjetaId}/revelar`, {}, 2);
        assert.equal(r.status, 200);
        assert.equal(r.headers['Cache-Control'], 'no-store, private');
        assert.equal(r.body.tarjeta.cvv, '123');
        assert.ok(r.body.tarjeta.numero_tarjeta === raw.numero_tarjeta);
        r = await pedir('tarjetas', 'POST', '/buscar', { busqueda: raw.numero_tarjeta });
        assert.equal(r.body.tarjetas.length, 1);
        assert.ok(r.body.tarjetas[0].numero_tarjeta !== raw.numero_tarjeta);
        assert.equal('cvv_cifrado' in r.body.tarjetas[0], false);
        assert.equal((await pedir('tarjetas', 'POST', '/buscar', { busqueda: 'Cliente de prueba' })).body.tarjetas.length, 1);
        assert.equal((await pedir('tarjetas', 'POST', '/buscar', { busqueda: 'Cliente' }, 2)).status, 403);
        r = await pedir('tarjetas', 'PUT', `/${tarjetaId}`, { fecha_vencimiento: '05/2028' });
        assert.equal(r.body.tarjeta.fecha_vencimiento, '202805');
        assert.equal((await pedir('tarjetas', 'PUT', `/${tarjetaId}`, { id_emisor: 'OTRO' })).status, 400);
        const perfil = await pedir('auth', 'GET', '/me', undefined, 2);
        assert.equal(perfil.status, 200);
        assert.equal(perfil.body.usuario.correo, 'cliente@example.test');
        assert.equal('password_hash' in perfil.body.usuario, false);
        await client.query('UPDATE tarjetas SET cvv_cifrado=NULL WHERE id_tarjeta=$1', [tarjetaId]);
        r = await pedir('tarjetas', 'POST', `/${tarjetaId}/revelar`, {}, 2);
        assert.equal(r.body.tarjeta.cvv, null);
    });
    await t.test('pago atómico con centavos, validación de saldo y permisos', async () => {
        const creada = await pedir('tarjetas', 'POST', '/', { ...datosTarjeta, monto_autorizado: 0.3, monto_disponible: 0.1 });
        assert.equal(creada.status, 201);
        const id = creada.body.tarjeta.id_tarjeta;
        const pago = { id_tarjeta: id, tipo: 'PAGO', monto: 0.2, comercio: 'Pago recibido' };
        assert.equal((await pedir('transacciones', 'POST', '/', pago, 2)).status, 403);
        assert.equal((await pedir('transacciones', 'POST', '/', { ...pago, monto: 0.001 })).status, 400);
        const r = await pedir('transacciones', 'POST', '/', pago);
        assert.equal(r.status, 201);
        assert.equal(r.body.transaccion.saldo_nuevo, 0.3);
        assert.ok(r.body.transaccion.fecha);
        assert.equal((await pedir('transacciones', 'POST', '/', { ...pago, monto: 0.01 })).status, 400);
        assert.equal(Number((await client.query('SELECT monto_disponible FROM tarjetas WHERE id_tarjeta=$1', [id])).rows[0].monto_disponible), 0.3);
        assert.equal((await client.query('SELECT * FROM transacciones WHERE id_tarjeta=$1', [id])).rows.length, 1);
        // No deja tarjetas adicionales para los escenarios de cancelación posteriores.
        await client.query('DELETE FROM transacciones WHERE id_tarjeta=$1', [id]);
        await client.query('DELETE FROM tarjetas WHERE id_tarjeta=$1', [id]);
    });
    await t.test('edición conserva utilizado y CVV cuando no se proporciona uno nuevo', async () => {
        const hash = (await client.query('SELECT cvv_hash FROM tarjetas WHERE id_tarjeta=$1', [tarjetaId])).rows[0].cvv_hash;
        const url = `/${tarjetaId}`;
        assert.equal((await pedir('tarjetas', 'PUT', url, { monto_autorizado: 299 })).status, 400);
        const r = await pedir('tarjetas', 'PUT', url, { monto_autorizado: 1200, nombre_titular: 'Titular actualizado', fecha_vencimiento: '203101', estado: 'BLOQUEADA' });
        assert.equal(r.status, 200);
        assert.equal(r.body.tarjeta.monto_disponible, 900);
        assert.equal(r.body.tarjeta.nombre_titular, 'Titular actualizado');
        assert.equal((await client.query('SELECT cvv_hash FROM tarjetas WHERE id_tarjeta=$1', [tarjetaId])).rows[0].cvv_hash, hash);
        assert.equal((await pedir('tarjetas', 'PUT', url, { cvv: '456' })).status, 200);
        const nuevoHash = (await client.query('SELECT cvv_hash FROM tarjetas WHERE id_tarjeta=$1', [tarjetaId])).rows[0].cvv_hash;
        assert.ok(await require('bcrypt').compare('456', nuevoHash));
        assert.equal((await pedir('tarjetas', 'DELETE', url)).status, 200);
        assert.equal((await client.query('SELECT estado FROM tarjetas WHERE id_tarjeta=$1', [tarjetaId])).rows[0].estado, 'CANCELADA');
    });
    await t.test('reasignación no transfiere la preferencia de favorita del propietario anterior', async () => {
        await client.query('UPDATE tarjetas SET favorita=TRUE WHERE id_tarjeta=$1', [tarjetaId]);
        const r = await pedir('tarjetas', 'PUT', `/${tarjetaId}`, { id_usuario: nuevoUsuario });
        assert.equal(r.status, 200);
        assert.equal((await client.query('SELECT favorita FROM tarjetas WHERE id_tarjeta=$1', [tarjetaId])).rows[0].favorita, false);
    });
    await t.test('eliminar desactiva la cuenta, cancela tarjetas y conserva propietarios', async () => {
        await pedir('tarjetas', 'POST', '/', { ...datosTarjeta, id_usuario: nuevoUsuario });
        const r = await pedir('usuarios', 'DELETE', `/${nuevoUsuario}`);
        assert.equal(r.status, 200);
        assert.equal(r.body.tarjetas_canceladas, 1);
        const rows = (await client.query('SELECT id_usuario,estado FROM tarjetas WHERE id_usuario=$1', [nuevoUsuario])).rows;
        assert.equal(rows.length, 2);
        assert.ok(rows.every(row => row.estado === 'CANCELADA' && row.id_usuario === nuevoUsuario));
        assert.equal((await pedir('tarjetas', 'GET', '/mias', undefined, nuevoUsuario)).status, 403);
        assert.equal((await pedir('tarjetas', 'PUT', `/${tarjetaId}`, { estado: 'ACTIVA' })).status, 400);
    });
    await t.test('revierte la desactivación si falla la cancelación de tarjetas', async () => {
        await pedir('tarjetas', 'POST', '/', { ...datosTarjeta });
        await client.query(`CREATE FUNCTION pg_temp.fallar_cancelacion() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fallo de prueba'; END $$;
            CREATE TRIGGER fallo_prueba BEFORE UPDATE ON tarjetas FOR EACH ROW EXECUTE FUNCTION pg_temp.fallar_cancelacion();`);
        assert.equal((await pedir('usuarios', 'DELETE', '/2')).status, 500);
        assert.equal((await client.query('SELECT activo FROM usuarios WHERE id_usuario=2')).rows[0].activo, true);
        assert.equal((await client.query('SELECT estado FROM tarjetas WHERE id_usuario=2')).rows[0].estado, 'ACTIVA');
    });
});
