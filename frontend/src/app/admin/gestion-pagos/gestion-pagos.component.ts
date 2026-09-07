import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
import { TarjetasService } from '../../core/services/tarjetas.service';
import { TransaccionesService } from '../../core/services/transacciones.service';
import { PanelClienteService } from '../../core/services/panel-cliente.service';
import { Tarjeta } from '../../core/models/tarjeta.model';
import { PagoResponse } from '../../core/models/transaccion.model';
import { errorApi } from '../components/admin-utils';

@Component({
  selector: 'app-gestion-pagos',
  standalone: false,
  templateUrl: './gestion-pagos.component.html',
})
export class GestionPagosComponent implements OnInit {
  private tarjetasService = inject(TarjetasService);
  private transacciones = inject(TransaccionesService);
  private destroy = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  readonly panel = inject(PanelClienteService);
  busqueda = new FormControl('', { nonNullable: true });
  monto = new FormControl<number | null>(null);
  formulario = new FormGroup({ monto: this.monto });
  resultados: Tarjeta[] = [];
  seleccionada: Tarjeta | null = null;
  comprobante: PagoResponse['transaccion'] | null = null;
  buscando = false;
  busquedaRealizada = false;
  guardando = false;
  errorBusqueda = '';
  error = '';
  mensaje = '';
  get deuda(): number {
    return this.seleccionada
      ? Math.max(
          0,
          Math.round(
            (Number(this.seleccionada.monto_autorizado) -
              Number(this.seleccionada.monto_disponible)) *
              100,
          ) / 100,
        )
      : 0;
  }
  ngOnInit(): void {
    this.busqueda.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((valor) => {
          this.errorBusqueda = '';
          this.resultados = [];
          this.busquedaRealizada = !!valor.trim();
          if (!valor.trim()) {
            this.buscando = false;
            this.cdr.markForCheck();
            return of({ tarjetas: [] });
          }
          this.buscando = true;
          this.cdr.markForCheck();
          return this.tarjetasService.buscar(valor.trim()).pipe(
            catchError((e) => {
              this.errorBusqueda = errorApi(e, 'No fue posible buscar las tarjetas');
              return of({ tarjetas: [] });
            }),
            finalize(() => {
              this.buscando = false;
              this.cdr.markForCheck();
            }),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((r) => {
        this.resultados = r.tarjetas;
        this.cdr.markForCheck();
      });
  }
  seleccionar(tarjeta: Tarjeta): void {
    if (this.guardando) return;
    this.seleccionada = tarjeta;
    this.error = '';
    this.mensaje = '';
    this.comprobante = null;
    this.actualizarMonto();
  }
  private actualizarMonto(): void {
    this.monto.reset();
    this.monto.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(this.deuda),
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ]);
    this.monto.updateValueAndValidity();
  }
  registrarPago(): void {
    if (this.guardando || !this.seleccionada || this.seleccionada.estado === 'CANCELADA') return;
    if (this.monto.invalid) {
      this.monto.markAsTouched();
      return;
    }
    const tarjeta = this.seleccionada;
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.comprobante = null;
    this.busqueda.disable({ emitEvent: false });
    this.transacciones
      .registrarPago(tarjeta.id_tarjeta, Number(this.monto.value))
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.guardando = false;
          this.busqueda.enable({ emitEvent: false });
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (r) => {
          tarjeta.monto_disponible = Number(r.transaccion.saldo_nuevo);
          this.resultados = this.resultados.map((t) =>
            t.id_tarjeta === tarjeta.id_tarjeta ? tarjeta : t,
          );
          this.comprobante = r.transaccion;
          this.mensaje = r.mensaje || 'Pago registrado correctamente';
          this.actualizarMonto();
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.error = errorApi(e, 'No fue posible registrar el pago');
          this.cdr.markForCheck();
        },
      });
  }
}
