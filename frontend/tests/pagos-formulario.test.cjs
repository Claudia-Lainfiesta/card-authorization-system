const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');

test('el formulario renderizado envía el pago, valida el monto y presenta el resultado', async () => {
  // DOM que Angular ya incluye para SSR; no se instala otra dependencia.
  const serverRoot = path.dirname(require.resolve('@angular/platform-server/package.json'));
  const { default: domino } = await import(
    pathToFileURL(path.join(serverRoot, 'third_party/domino/bundled-domino.mjs'))
  );
  const window = domino.createWindow(
    '<!doctype html><html><body></body></html>',
    'http://localhost/',
  );
  Object.assign(globalThis, {
    window,
    document: window.document,
    Node: window.Node,
    HTMLElement: window.HTMLElement,
  });
  await import('@angular/compiler');
  const core = await import('@angular/core');
  const common = await import('@angular/common');
  const forms = await import('@angular/forms');
  const http = await import('@angular/common/http');
  const httpTesting = await import('@angular/common/http/testing');
  const { TestBed } = await import('@angular/core/testing');
  const { BrowserTestingModule, platformBrowserTesting } =
    await import('@angular/platform-browser/testing');
  const imports = {
    '@angular/core': core,
    '@angular/common': common,
    '@angular/forms': forms,
    '@angular/common/http': http,
    '@angular/core/rxjs-interop': await import('@angular/core/rxjs-interop'),
  };
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
    const localRequire = (name) =>
      imports[name] ||
      (name.startsWith('.')
        ? cargar(path.resolve(path.dirname(file), name + '.ts'))
        : require(name));
    new Function('require', 'module', 'exports', output)(localRequire, mod, mod.exports);
    cache.set(file, mod.exports);
    return mod.exports;
  }
  const { GestionPagosComponent } = cargar(
    'src/app/admin/gestion-pagos/gestion-pagos.component.ts',
  );
  const { TarjetasService } = cargar('src/app/core/services/tarjetas.service.ts');
  const { TransaccionesService } = cargar('src/app/core/services/transacciones.service.ts');
  const { PanelClienteService } = cargar('src/app/core/services/panel-cliente.service.ts');
  const { AdminMensajeComponent, AdminErrorCampoComponent } = cargar(
    'src/app/admin/components/admin-controls.ts',
  );
  class NavbarPrueba {}
  core.Component({ selector: 'app-navbar', template: '' })(NavbarPrueba);
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
  try {
    TestBed.configureTestingModule({
      declarations: [GestionPagosComponent],
      imports: [
        common.CommonModule,
        forms.ReactiveFormsModule,
        NavbarPrueba,
        AdminMensajeComponent,
        AdminErrorCampoComponent,
      ],
      providers: [
        core.provideZonelessChangeDetection(),
        http.provideHttpClient(),
        httpTesting.provideHttpClientTesting(),
        {
          provide: TarjetasService,
          useFactory: () => new TarjetasService(core.inject(http.HttpClient)),
        },
        {
          provide: TransaccionesService,
          useFactory: () => new TransaccionesService(core.inject(http.HttpClient)),
        },
        { provide: PanelClienteService, useFactory: () => new PanelClienteService() },
      ],
    });
    TestBed.overrideComponent(GestionPagosComponent, {
      set: {
        templateUrl: undefined,
        template: fs.readFileSync(
          path.join(__dirname, '../src/app/admin/gestion-pagos/gestion-pagos.component.html'),
          'utf8',
        ),
      },
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(GestionPagosComponent);
    const requests = TestBed.inject(httpTesting.HttpTestingController);
    fixture.detectChanges();
    fixture.componentInstance.seleccionar({
      id_tarjeta: 42,
      numero_tarjeta: '************1234',
      nombre_titular: 'Cliente Prueba',
      monto_autorizado: 1000,
      monto_disponible: 700,
      estado: 'ACTIVA',
    });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const root = fixture.nativeElement;
    const input = root.querySelector('#monto-pago');
    const form = root.querySelector('form');
    assert.equal(root.querySelector('button[type="submit"]').type, 'submit');
    const escribir = (valor) => {
      input.value = valor;
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
      fixture.detectChanges();
    };
    // El evento nativo submit recorre la conexión DOM -> FormGroupDirective -> ngSubmit.
    // Es la misma conexión usada al pulsar el botón o enviar con Enter.
    const enviar = () => {
      form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
    };
    enviar();
    requests.expectNone((r) => r.method === 'POST');
    assert.match(root.textContent, /Ingresa un monto positivo/);
    escribir('301');
    enviar();
    requests.expectNone((r) => r.method === 'POST');
    escribir('100');
    enviar();
    const pago = requests.expectOne((r) => r.url.endsWith('/transacciones') && r.method === 'POST');
    assert.deepEqual(pago.request.body, {
      id_tarjeta: 42,
      monto: 100,
      tipo: 'PAGO',
      comercio: 'Pago recibido',
    });
    assert.equal(root.querySelector('button[type="submit"]').disabled, true);
    assert.match(root.textContent, /Procesando pago/);
    enviar();
    requests.expectNone((r) => r.method === 'POST');
    pago.flush({ error: 'No fue posible procesar el pago' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    assert.match(root.textContent, /No fue posible procesar el pago/);
    assert.equal(input.value, '100');
    assert.equal(root.querySelector('button[type="submit"]').disabled, false);
    enviar();
    requests
      .expectOne((r) => r.url.endsWith('/transacciones'))
      .flush({
        mensaje: 'Pago registrado correctamente',
        transaccion: {
          id_transaccion: 7,
          id_tarjeta: 42,
          monto: 100,
          saldo_anterior: 700,
          saldo_nuevo: 800,
          fecha: '2026-09-07T12:00:00Z',
        },
      });
    fixture.detectChanges();
    assert.match(root.textContent, /Pago registrado correctamente/);
    assert.match(root.textContent, /Pago #7/);
    assert.equal(fixture.componentInstance.deuda, 200);
    assert.equal(fixture.componentInstance.seleccionada.monto_disponible, 800);
    assert.equal(input.value, '');
    requests.verify();
    fixture.destroy();
  } finally {
    TestBed.resetTestingModule();
    TestBed.resetTestEnvironment();
  }
});
