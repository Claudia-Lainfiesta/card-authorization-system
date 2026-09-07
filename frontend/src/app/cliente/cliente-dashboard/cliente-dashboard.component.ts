import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { TarjetasService } from '../../core/services/tarjetas.service';
import { TransaccionesService } from '../../core/services/transacciones.service';
import { PanelClienteService } from '../../core/services/panel-cliente.service';
import { Tarjeta } from '../../core/models/tarjeta.model';
import { Transaccion } from '../../core/models/transaccion.model';
import { AlertaTarjeta } from '../../core/models/panel-cliente.model';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: false,
  templateUrl: './cliente-dashboard.component.html',
  styleUrl: './cliente-dashboard.component.css',
})
export class ClienteDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private tarjetasService = inject(TarjetasService);
  private transaccionesService = inject(TransaccionesService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  readonly panel = inject(PanelClienteService);

  nombre = this.authService.obtenerUsuario()?.nombre_completo || 'Cliente';
  saludo = this.panel.saludo();
  tarjetas: Tarjeta[] = [];
  actividad: Transaccion[] = [];
  alertas: AlertaTarjeta[] = [];
  resumen = this.panel.resumen([]);
  cargandoTarjetas = true;
  cargandoHistorial = true;
  errorTarjetas = '';
  errorHistorial = '';

  ngOnInit(): void {
    this.cargarTarjetas();
    this.cargarHistorial();
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
          this.resumen = this.panel.resumen(this.tarjetas);
          this.alertas = this.panel.alertas(this.tarjetas);
          this.cargandoTarjetas = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorTarjetas = 'No fue posible cargar tus tarjetas';
          this.cargandoTarjetas = false;
          this.cdr.markForCheck();
        },
      });
  }

  cargarHistorial(): void {
    this.cargandoHistorial = true;
    this.errorHistorial = '';
    this.transaccionesService
      .listarMias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.actividad = this.panel.ordenar(respuesta.transacciones).slice(0, 5);
          this.cargandoHistorial = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorHistorial = 'No fue posible cargar tu actividad reciente';
          this.cargandoHistorial = false;
          this.cdr.markForCheck();
        },
      });
  }
}
