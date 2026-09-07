const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('formularios y listados administrativos con Angular y RxJS', async () => {
  await import('@angular/compiler');
  const core = await import('@angular/core');
  const imports = {
    '@angular/core': core,
    '@angular/core/rxjs-interop': await import('@angular/core/rxjs-interop'),
    '@angular/common': await import('@angular/common'),
    '@angular/common/http': await import('@angular/common/http'),
    '@angular/forms': await import('@angular/forms'),
    '@angular/router': await import('@angular/router'),
  };
  const { of, Subject } = require('rxjs');
  const cache = new Map();
  function cargar(file) {
    file = path.resolve(__dirname, '..', file);
    if (cache.has(file)) return cache.get(file);
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    }).outputText;
    const mod = { exports: {} };
    cache.set(file, mod.exports);
    const localRequire = (name) => {
      if (imports[name]) return imports[name];
      if (name.startsWith('.')) return cargar(path.resolve(path.dirname(file), name + '.ts'));
      return require(name);
    };
    new Function('require', 'module', 'exports', output)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const { MisTarjetasComponent } = cargar('src/app/cliente/mis-tarjetas/mis-tarjetas.component.ts');
  const { GestionPagosComponent } = cargar(
    'src/app/admin/gestion-pagos/gestion-pagos.component.ts',
  );
  const { TransaccionesService } = cargar('src/app/core/services/transacciones.service.ts');
  const { TarjetasService } = cargar('src/app/core/services/tarjetas.service.ts');
  const { UsuariosService } = cargar('src/app/core/services/usuarios.service.ts');
  const { AuthService } = cargar('src/app/core/services/auth.service.ts');
  const { ReportesService } = cargar('src/app/core/services/reportes.service.ts');
  const { PanelClienteService } = cargar('src/app/core/services/panel-cliente.service.ts');
  const { GestionTarjetasComponent } = cargar(
    'src/app/admin/gestion-tarjetas/gestion-tarjetas.component.ts',
  );
  const { GestionUsuariosComponent } = cargar(
    'src/app/admin/gestion-usuarios/gestion-usuarios.component.ts',
  );
  const { AdminDashboardComponent } = cargar(
    'src/app/admin/admin-dashboard/admin-dashboard.component.ts',
  );
  const usuarios = [
    {
      id_usuario: 1,
      nombre_completo: 'Admin Prueba',
      correo: 'admin@example.test',
      rol: 'ADMINISTRADOR',
      activo: true,
    },
    {
      id_usuario: 2,
      nombre_completo: 'José Cliente',
      correo: 'cliente@example.test',
      rol: 'CLIENTE',
      activo: true,
    },
  ];
  const tarjeta = {
    id_tarjeta: 1,
    numero_tarjeta: '4XXX XXXX XXXX 1234',
    nombre_titular: 'José Cliente',
    fecha_vencimiento: '203012',
    monto_autorizado: 1000,
    monto_disponible: 700,
    id_usuario: 2,
    id_emisor: 'BANCO-PRUEBA-01',
    emisor: 'Banco Prueba',
    estado: 'ACTIVA',
  };
  const tarjetas = [
    tarjeta,
    { ...tarjeta, id_tarjeta: 2, nombre_titular: 'Otro titular', estado: 'BLOQUEADA' },
  ];
  const peticiones = [];
  const request = (accion, ...args) => {
    const subject = new Subject();
    peticiones.push({ accion, args, subject });
    return subject;
  };
  const injector = core.createEnvironmentInjector([
    {
      provide: imports['@angular/forms'].FormBuilder,
      useValue: new imports['@angular/forms'].FormBuilder(),
    },
    { provide: imports['@angular/common'].DOCUMENT, useValue: { hidden: false } },
    {
      provide: TransaccionesService,
      useValue: { registrarPago: (...args) => request('pago', ...args) },
    },
    { provide: core.ChangeDetectorRef, useValue: { markForCheck() {} } },
    { provide: AuthService, useValue: { obtenerUsuario: () => usuarios[0] } },
    { provide: PanelClienteService, useValue: new PanelClienteService() },
    {
      provide: UsuariosService,
      useValue: {
        listar: () => of({ usuarios }),
        crear: (...args) => request('crearUsuario', ...args),
        actualizar: (...args) => request('editarUsuario', ...args),
        eliminar: (...args) => request('eliminarUsuario', ...args),
      },
    },
    {
      provide: TarjetasService,
      useValue: {
        listarTodas: () => of({ tarjetas }),
        listarMias: () => of({ tarjetas }),
        revelar: (...args) => request('revelar', ...args),
        buscar: (...args) => request('buscar', ...args),
        crear: (...args) => request('crearTarjeta', ...args),
        actualizar: (...args) => request('editarTarjeta', ...args),
        cancelar: (...args) => request('cancelarTarjeta', ...args),
      },
    },
    {
      provide: ReportesService,
      useValue: {
        emisores: () =>
          of({
            emisores: [{ id_emisor: 'BANCO-PRUEBA-01', nombre: 'Banco Prueba', activo: true }],
          }),
        resumen: () => request('resumen'),
        bitacora: (...args) => request('bitacora', ...args),
      },
    },
    { provide: imports['@angular/router'].ActivatedRoute, useValue: { snapshot: { data: {} } } },
  ]);
  try {
    const cards = core.runInInjectionContext(injector, () => new GestionTarjetasComponent());
    cards.ngOnInit();
    cards.busqueda = 'jose';
    cards.estadoFiltro = 'ACTIVA';
    assert.deepEqual(
      cards.filtradas.map((t) => t.id_tarjeta),
      [1],
    );
    cards.estadoFiltro = 'BLOQUEADA';
    assert.equal(cards.filtradas.length, 0);
    cards.busqueda = '1234';
    assert.equal(cards.filtradas.length, 1);
    cards.pagina = 2;
    cards.filtrar();
    assert.equal(cards.pagina, 1);
    cards.editar(tarjeta);
    assert.equal(cards.formulario.controls.fecha_vencimiento.value, '12/2030');
    assert.equal(cards.formulario.controls.cvv.value, '');
    assert.equal(cards.formulario.valid, true);
    cards.formulario.controls.fecha_vencimiento.setValue('13/2030');
    assert.equal(cards.formulario.valid, false);
    cards.formulario.controls.fecha_vencimiento.setValue('12/2030');
    cards.formulario.controls.monto_autorizado.setValue(1200);
    cards.guardar();
    const edit = peticiones.at(-1);
    assert.equal(edit.accion, 'editarTarjeta');
    assert.equal(edit.args[1].monto_autorizado, 1200);
    assert.equal('cvv' in edit.args[1], false);
    assert.equal('numero_tarjeta' in edit.args[1], false);
    assert.equal('monto_disponible' in edit.args[1], false);
    const count = peticiones.length;
    cards.guardar();
    cards.cerrar();
    assert.equal(peticiones.length, count);
    assert.equal(cards.mostrandoFormulario, true);
    edit.subject.error({
      error: { error: 'El monto autorizado no puede ser menor al monto ya utilizado' },
    });
    assert.equal(cards.guardando, false);
    assert.ok(cards.errorFormulario.includes('utilizado'));
    assert.equal(cards.formulario.controls.monto_autorizado.value, 1200);
    cards.guardar();
    peticiones.at(-1).subject.next({ mensaje: 'Guardado', tarjeta });
    peticiones.at(-1).subject.complete();
    assert.equal(cards.mostrandoFormulario, false);
    assert.equal(cards.formulario.controls.cvv.value, '');
    cards.abrirFormularioCreacion();
    assert.equal(cards.formulario.valid, false);
    cards.formulario.setValue({
      nombre_titular: 'Titular Nuevo',
      fecha_vencimiento: '12/2030',
      cvv: '123',
      monto_autorizado: 500,
      id_usuario: 2,
      estado: 'ACTIVA',
    });
    cards.guardar();
    assert.equal(peticiones.at(-1).args[0].monto_disponible, 500);
    peticiones.at(-1).subject.next({ mensaje: 'Creada', tarjeta });
    peticiones.at(-1).subject.complete();
    assert.equal(cards.formulario.controls.cvv.value, '');
    cards.confirmarCancelacion(tarjeta);
    assert.equal(peticiones.at(-1).accion, 'crearTarjeta');
    cards.cancelarTarjeta();
    assert.equal(peticiones.at(-1).accion, 'cancelarTarjeta');
    peticiones.at(-1).subject.error({});
    assert.equal(cards.tarjetaEliminando, tarjeta);
    assert.ok(cards.errorFormulario);

    const users = core.runInInjectionContext(injector, () => new GestionUsuariosComponent());
    users.ngOnInit();
    users.busqueda = 'JOSE';
    users.rolFiltro = 'CLIENTE';
    assert.equal(users.filtrados.length, 1);
    users.rolFiltro = 'ADMINISTRADOR';
    assert.equal(users.filtrados.length, 0);
    users.abrir(usuarios[0]);
    assert.equal(users.formulario.controls.rol.disabled, true);
    assert.equal(users.formulario.controls.activo.disabled, true);
    assert.equal(users.formulario.controls.password.disabled, true);
    const before = peticiones.length;
    users.formulario.controls.rol.setValue('CLIENTE');
    users.guardar();
    assert.equal(peticiones.length, before);
    assert.ok(users.errorFormulario.includes('tu cuenta'));
    users.confirmarEliminacion(usuarios[0]);
    assert.equal(users.usuarioEliminando, null);
    users.abrir(usuarios[1]);
    users.guardar();
    assert.equal(peticiones.at(-1).accion, 'editarUsuario');
    assert.equal('password' in peticiones.at(-1).args[1], false);
    peticiones
      .at(-1)
      .subject.error({ error: { error: 'Ya existe un usuario registrado con ese correo' } });
    assert.equal(users.formulario.controls.correo.hasError('duplicado'), true);
    assert.equal(users.mostrandoFormulario, true);
    users.cerrar();
    users.abrir();
    assert.equal(users.formulario.controls.password.enabled, true);
    assert.equal(users.formulario.valid, false);

    const clientCards = core.runInInjectionContext(injector, () => new MisTarjetasComponent());
    clientCards.ngOnInit();
    assert.equal(clientCards.numeroVisible(tarjeta), '**** **** **** 1234');
    clientCards.alternarVisibilidad(tarjeta);
    const reveal = peticiones.at(-1);
    clientCards.alternarVisibilidad(tarjeta);
    assert.equal(peticiones.at(-1), reveal);
    reveal.subject.next({
      tarjeta: { id_tarjeta: 1, numero_tarjeta: '4000000000001234', cvv: '123' },
    });
    reveal.subject.complete();
    assert.equal(clientCards.reveladas.size, 1);
    assert.equal(clientCards.numeroVisible(tarjeta).replace(/ /g, '').length, 16);
    clientCards.alternarVisibilidad(tarjeta);
    assert.equal(clientCards.reveladas.size, 0);
    clientCards.alternarVisibilidad(tarjeta);
    const doc = injector.get(imports['@angular/common'].DOCUMENT);
    doc.hidden = true;
    clientCards.cambioVisibilidad();
    doc.hidden = false;
    peticiones
      .at(-1)
      .subject.next({ tarjeta: { id_tarjeta: 1, numero_tarjeta: '4000000000001234', cvv: '123' } });
    peticiones.at(-1).subject.complete();
    assert.equal(
      clientCards.reveladas.size,
      0,
      'descarta una respuesta pendiente al ocultar la pestaña',
    );
    clientCards.alternarVisibilidad(tarjeta);
    peticiones.at(-1).subject.error({});
    assert.equal(clientCards.reveladas.size, 0);
    assert.ok(clientCards.erroresVisibilidad.get(1));

    const pagos = core.runInInjectionContext(injector, () => new GestionPagosComponent());
    pagos.ngOnInit();
    pagos.busqueda.setValue('José');
    await new Promise((r) => setTimeout(r, 350));
    const busquedaAnterior = peticiones.at(-1);
    pagos.busqueda.setValue('Otro');
    await new Promise((r) => setTimeout(r, 350));
    busquedaAnterior.subject.next({ tarjetas: [tarjeta] });
    assert.equal(pagos.resultados.length, 0, 'ignora búsquedas anteriores');
    peticiones.at(-1).subject.next({ tarjetas });
    peticiones.at(-1).subject.complete();
    pagos.seleccionar(tarjeta);
    pagos.monto.setValue(301);
    assert.equal(pagos.monto.invalid, true);
    pagos.monto.setValue(100.001);
    assert.equal(pagos.monto.invalid, true);
    pagos.monto.setValue(100);
    pagos.registrarPago();
    const pagoFallido = peticiones.at(-1);
    pagos.registrarPago();
    pagos.seleccionar(tarjetas[1]);
    assert.equal(peticiones.at(-1), pagoFallido);
    assert.equal(pagos.seleccionada.id_tarjeta, 1);
    pagoFallido.subject.error({});
    assert.equal(pagos.guardando, false);
    assert.equal(pagos.monto.value, 100);
    assert.ok(pagos.error);
    pagos.registrarPago();
    peticiones
      .at(-1)
      .subject.next({
        mensaje: 'Pago registrado',
        transaccion: {
          id_transaccion: 1,
          id_tarjeta: 1,
          monto: 100,
          saldo_anterior: 700,
          saldo_nuevo: 800,
          fecha: '2026-09-06T12:00:00Z',
        },
      });
    peticiones.at(-1).subject.complete();
    assert.equal(pagos.deuda, 200);
    assert.equal(pagos.comprobante.id_transaccion, 1);
    assert.equal(pagos.monto.value, null);
    assert.equal(pagos.busqueda.enabled, true);

    const dashboard = core.runInInjectionContext(injector, () => new AdminDashboardComponent());
    dashboard.ngOnInit();
    const metricas = peticiones.find((p) => p.accion === 'resumen');
    const bitacora = peticiones.find((p) => p.accion === 'bitacora');
    metricas.subject.error({});
    bitacora.subject.next({ autorizaciones: [], total: 0, pagina: 1 });
    bitacora.subject.complete();
    assert.ok(dashboard.errorResumen);
    assert.equal(dashboard.cargandoBitacora, false);
    assert.equal(dashboard.errorBitacora, '');
  } finally {
    injector.destroy();
  }
});
