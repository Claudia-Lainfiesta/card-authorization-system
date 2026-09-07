import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransaccionesService } from '../../core/services/transacciones.service';
import { TarjetasService } from '../../core/services/tarjetas.service';
import { PanelClienteService } from '../../core/services/panel-cliente.service';
import { Transaccion, TipoTransaccion } from '../../core/models/transaccion.model';
import { Tarjeta } from '../../core/models/tarjeta.model';
import { FiltrosHistorial, PeriodoHistorial } from '../../core/models/panel-cliente.model';

@Component({
  selector: 'app-mi-historial',
  standalone: false,
  templateUrl: './mi-historial.component.html',
  styleUrl: './mi-historial.component.css',
})
export class MiHistorialComponent implements OnInit {
  private transaccionesService = inject(TransaccionesService);
  private tarjetasService = inject(TarjetasService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  readonly panel = inject(PanelClienteService);
  transacciones: Transaccion[] = [];
  tarjetas: Tarjeta[] = [];
  filtradas: Transaccion[] = [];
  filtros: FiltrosHistorial = { tarjeta: '', tipo: '', periodo: 'TODOS' };
  readonly porPagina = 10;
  pagina = 1;
  cargando = true;
  cargandoTarjetas = true;
  error = '';
  errorTarjetas = '';

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.filtradas.length / this.porPagina));
  }

  get transaccionesPagina(): Transaccion[] {
    return this.filtradas.slice((this.pagina - 1) * this.porPagina, this.pagina * this.porPagina);
  }

  ngOnInit(): void {
    this.cargarHistorial();
    this.cargarTarjetas();
  }

  cargarHistorial(): void {
    this.cargando = true;
    this.error = '';
    this.transaccionesService
      .listarMias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.transacciones = this.panel.ordenar(respuesta.transacciones);
          this.aplicarFiltros();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.error = 'No fue posible cargar tu historial';
          this.cdr.markForCheck();
        },
      });
  }

  cargarTarjetas(): void {
    this.cargandoTarjetas = true;
    this.errorTarjetas = '';
    this.tarjetasService
      .listarMias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.tarjetas = respuesta.tarjetas;
          this.cargandoTarjetas = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorTarjetas = 'No fue posible cargar las tarjetas del filtro';
          this.cargandoTarjetas = false;
          this.cdr.markForCheck();
        },
      });
  }

  cambiarTarjeta(tarjeta: string): void {
    this.filtros.tarjeta = tarjeta;
    this.aplicarFiltros();
  }

  cambiarTipo(tipo: string): void {
    if (!['', 'CONSUMO', 'PAGO', 'REVERSO'].includes(tipo)) return;
    this.filtros.tipo = tipo as TipoTransaccion | '';
    this.aplicarFiltros();
  }

  cambiarPeriodo(periodo: string): void {
    if (!['TODOS', '30', '90', 'ANIO'].includes(periodo)) return;
    this.filtros.periodo = periodo as PeriodoHistorial;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    // /transacciones/mias devuelve la lista completa; filtros y paginación son locales.
    this.filtradas = this.panel.filtrar(this.transacciones, this.filtros);
    this.pagina = 1;
  }

  limpiarFiltros(): void {
    this.filtros = { tarjeta: '', tipo: '', periodo: 'TODOS' };
    this.aplicarFiltros();
  }

  cambiarPagina(pagina: number): void {
    this.pagina = Math.max(1, Math.min(this.totalPaginas, pagina));
  }
}
