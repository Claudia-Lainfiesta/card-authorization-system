import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { TarjetasService } from '../../core/services/tarjetas.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ReportesService } from '../../core/services/reportes.service';
import { PanelClienteService } from '../../core/services/panel-cliente.service';
import { Tarjeta, EstadoTarjeta, ActualizarTarjetaRequest } from '../../core/models/tarjeta.model';
import { Usuario } from '../../core/models/usuario.model';
import { Emisor } from '../../core/models/admin.model';
import { errorApi, normalizar } from '../components/admin-utils';

@Component({
  selector: 'app-gestion-tarjetas',
  standalone: false,
  templateUrl: './gestion-tarjetas.component.html',
  styleUrl: './gestion-tarjetas.component.css',
})
export class GestionTarjetasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TarjetasService);
  private usuariosService = inject(UsuariosService);
  private reportes = inject(ReportesService);
  private cdr = inject(ChangeDetectorRef);
  private destroy = inject(DestroyRef);
  readonly panel = inject(PanelClienteService);
  tarjetas: Tarjeta[] = [];
  usuarios: Usuario[] = [];
  emisores: Emisor[] = [];
  cargando = true;
  cargandoCatalogos = true;
  guardando = false;
  error = '';
  errorCatalogos = '';
  errorFormulario = '';
  mensaje = '';
  busqueda = '';
  estadoFiltro = '';
  pagina = 1;
  readonly porPagina = 10;
  readonly estados: EstadoTarjeta[] = ['ACTIVA', 'BLOQUEADA', 'VENCIDA', 'CANCELADA'];
  mostrandoFormulario = false;
  tarjetaEditando: Tarjeta | null = null;
  tarjetaEliminando: Tarjeta | null = null;
  formulario = this.fb.nonNullable.group({
    numero_tarjeta: ['', [Validators.required, Validators.pattern(/^4[0-9]{15}$/)]],
    nombre_titular: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    fecha_vencimiento: ['', [Validators.required, Validators.pattern(/^[0-9]{4}(0[1-9]|1[0-2])$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^[0-9]{3}$/)]],
    monto_autorizado: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(9999999999.99),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    id_emisor: ['', Validators.required],
    id_usuario: [0, [Validators.required, Validators.min(1)]],
    estado: ['ACTIVA' as EstadoTarjeta, Validators.required],
  });
  get filtradas(): Tarjeta[] {
    const texto = normalizar(this.busqueda);
    const digitos = this.busqueda.replace(/\D/g, '');
    return this.tarjetas.filter(
      (t) =>
        (!this.estadoFiltro || t.estado === this.estadoFiltro) &&
        (!texto ||
          normalizar(t.nombre_titular).includes(texto) ||
          (!!digitos &&
            t.numero_tarjeta
              .replace(/\D/g, '')
              .endsWith(digitos.length > 4 ? digitos.slice(-4) : digitos))),
    );
  }
  get visibles(): Tarjeta[] {
    return this.filtradas.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina);
  }
  filtrar(): void {
    this.pagina = 1;
  }
  ngOnInit(): void {
    this.cargarTarjetas();
    this.cargarCatalogos();
  }
  cargarTarjetas(): void {
    this.cargando = true;
    this.error = '';
    this.service
      .listarTodas()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.tarjetas = r.tarjetas;
          this.pagina = Math.min(
            this.pagina,
            Math.max(1, Math.ceil(this.filtradas.length / this.porPagina)),
          );
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.error = errorApi(e, 'No fue posible cargar las tarjetas');
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }
  cargarCatalogos(): void {
    this.cargandoCatalogos = true;
    this.errorCatalogos = '';
    forkJoin({ usuarios: this.usuariosService.listar(), emisores: this.reportes.emisores() })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.usuarios = r.usuarios.usuarios;
          this.emisores = r.emisores.emisores;
          this.cargandoCatalogos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorCatalogos = 'No fue posible cargar los usuarios y emisores del formulario';
          this.cargandoCatalogos = false;
          this.cdr.markForCheck();
        },
      });
  }
  abrirFormularioCreacion(): void {
    this.abrir(null);
  }
  editar(tarjeta: Tarjeta): void {
    this.abrir(tarjeta);
  }
  private abrir(tarjeta: Tarjeta | null): void {
    this.tarjetaEditando = tarjeta;
    this.errorFormulario = '';
    this.mensaje = '';
    const numero = tarjeta ? this.panel.numeroEnmascarado(tarjeta.numero_tarjeta) : '';
    this.formulario.reset({
      numero_tarjeta: numero,
      nombre_titular: tarjeta?.nombre_titular || '',
      fecha_vencimiento: tarjeta?.fecha_vencimiento || '',
      cvv: '',
      monto_autorizado: Number(tarjeta?.monto_autorizado || 0),
      id_usuario: tarjeta?.id_usuario || 0,
      id_emisor: tarjeta?.id_emisor || '',
      estado: tarjeta?.estado || 'ACTIVA',
    });
    this.formulario.controls.numero_tarjeta.setValidators([
      Validators.required,
      (control) =>
        (tarjeta && control.value === numero) || /^4[0-9]{15}$/.test(control.value)
          ? null
          : { pattern: true },
    ]);
    this.formulario.controls.cvv.setValidators(
      tarjeta
        ? [Validators.pattern(/^[0-9]{3}$/)]
        : [Validators.required, Validators.pattern(/^[0-9]{3}$/)],
    );
    this.formulario.controls.numero_tarjeta.updateValueAndValidity();
    this.formulario.controls.cvv.updateValueAndValidity();
    this.mostrandoFormulario = true;
  }
  cerrar(): void {
    if (this.guardando) return;
    this.mostrandoFormulario = false;
    this.tarjetaEditando = null;
    this.tarjetaEliminando = null;
    this.formulario.reset();
    this.errorFormulario = '';
  }
  guardar(): void {
    if (this.guardando) return;
    this.formulario.controls.nombre_titular.setValue(
      this.formulario.controls.nombre_titular.value.trim(),
    );
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const datos = this.formulario.getRawValue();
    const editando = this.tarjetaEditando;
    const cambios: ActualizarTarjetaRequest = { ...datos };
    if (editando) {
      if (datos.numero_tarjeta === this.panel.numeroEnmascarado(editando.numero_tarjeta))
        delete cambios.numero_tarjeta;
      if (!datos.cvv) delete cambios.cvv;
      if (datos.id_usuario === editando.id_usuario) delete cambios.id_usuario;
      if (datos.id_emisor === editando.id_emisor) delete cambios.id_emisor;
    }
    const peticion = editando
      ? this.service.actualizar(editando.id_tarjeta, cambios)
      : this.service.crear({ ...datos, monto_disponible: datos.monto_autorizado });
    this.guardando = true;
    this.errorFormulario = '';
    peticion
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (r) => {
          this.mostrandoFormulario = false;
          this.tarjetaEditando = null;
          this.formulario.reset();
          this.mensaje = r.mensaje || 'Tarjeta guardada correctamente';
          this.cargarTarjetas();
        },
        error: (e) => {
          this.errorFormulario = errorApi(e, 'No fue posible guardar la tarjeta');
          if (this.errorFormulario.includes('ya se encuentra registrada'))
            this.formulario.controls.numero_tarjeta.setErrors({ duplicado: true });
          this.cdr.markForCheck();
        },
      });
  }
  confirmarCancelacion(tarjeta: Tarjeta): void {
    this.tarjetaEliminando = tarjeta;
    this.errorFormulario = '';
    this.mensaje = '';
  }
  cancelarTarjeta(): void {
    if (!this.tarjetaEliminando || this.guardando) return;
    this.guardando = true;
    this.errorFormulario = '';
    this.service
      .cancelar(this.tarjetaEliminando.id_tarjeta)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (r) => {
          this.tarjetaEliminando = null;
          this.mensaje = r.mensaje || 'Tarjeta cancelada correctamente';
          this.cargarTarjetas();
        },
        error: (e) => {
          this.errorFormulario = errorApi(e, 'No fue posible cancelar la tarjeta');
          this.cdr.markForCheck();
        },
      });
  }
}
