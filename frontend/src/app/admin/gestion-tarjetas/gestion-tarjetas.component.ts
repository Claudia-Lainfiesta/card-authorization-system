import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TarjetasService } from '../../core/services/tarjetas.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { PanelClienteService } from '../../core/services/panel-cliente.service';
import { Tarjeta, EstadoTarjeta, ActualizarTarjetaRequest } from '../../core/models/tarjeta.model';
import { Usuario } from '../../core/models/usuario.model';
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
  private cdr = inject(ChangeDetectorRef);
  private destroy = inject(DestroyRef);
  readonly panel = inject(PanelClienteService);
  tarjetas: Tarjeta[] = [];
  usuarios: Usuario[] = [];
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
    nombre_titular: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    fecha_vencimiento: [
      '',
      [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/[0-9]{4}$/)],
    ],
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
    this.usuariosService
      .listar()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.usuarios = r.usuarios;
          this.cargandoCatalogos = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorCatalogos = 'No fue posible cargar los usuarios del formulario';
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
    const fecha = tarjeta?.fecha_vencimiento || '';
    this.formulario.reset({
      nombre_titular: tarjeta?.nombre_titular || '',
      fecha_vencimiento: fecha ? fecha.slice(4, 6) + '/' + fecha.slice(0, 4) : '',
      cvv: '',
      monto_autorizado: Number(tarjeta?.monto_autorizado || 0),
      id_usuario: tarjeta?.id_usuario || 0,
      estado: tarjeta?.estado || 'ACTIVA',
    });
    this.formulario.controls.cvv.setValidators(
      tarjeta
        ? [Validators.pattern(/^[0-9]{3}$/)]
        : [Validators.required, Validators.pattern(/^[0-9]{3}$/)],
    );
    this.formulario.controls.cvv.updateValueAndValidity();
    this.mostrandoFormulario = true;
  }
  enmascararFecha(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 6);
    const fecha = digitos.length > 2 ? digitos.slice(0, 2) + '/' + digitos.slice(2) : digitos;
    this.formulario.controls.fecha_vencimiento.setValue(fecha);
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
      if (!datos.cvv) delete cambios.cvv;
      if (datos.id_usuario === editando.id_usuario) delete cambios.id_usuario;
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
