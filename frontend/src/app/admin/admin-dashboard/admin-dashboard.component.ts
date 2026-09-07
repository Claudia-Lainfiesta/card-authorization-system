import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReportesService } from '../../core/services/reportes.service';
import { ResumenAdmin, AutorizacionBitacora } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private service = inject(ReportesService);
  private cdr = inject(ChangeDetectorRef);
  private destroy = inject(DestroyRef);
  readonly soloBitacora = inject(ActivatedRoute).snapshot.data['bitacora'] === true;
  nombre = inject(AuthService).obtenerUsuario()?.nombre_completo || 'Administrador';
  resumen: ResumenAdmin | null = null;
  autorizaciones: AutorizacionBitacora[] = [];
  cargandoResumen = true;
  cargandoBitacora = true;
  errorResumen = '';
  errorBitacora = '';
  pagina = 1;
  total = 0;
  ngOnInit(): void {
    if (!this.soloBitacora) this.cargarResumen();
    this.cargarBitacora();
  }
  cargarResumen(): void {
    this.cargandoResumen = true;
    this.errorResumen = '';
    this.service
      .resumen()
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.resumen = r.resumen;
          this.cargandoResumen = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorResumen = 'No fue posible cargar las métricas';
          this.cargandoResumen = false;
          this.cdr.markForCheck();
        },
      });
  }
  cargarBitacora(pagina = 1): void {
    if (pagina < 1) return;
    this.pagina = pagina;
    this.cargandoBitacora = true;
    this.errorBitacora = '';
    this.service
      .bitacora(pagina)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => {
          this.autorizaciones = r.autorizaciones;
          this.total = r.total;
          this.pagina = r.pagina;
          this.cargandoBitacora = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorBitacora = 'No fue posible cargar la bitácora';
          this.cargandoBitacora = false;
          this.cdr.markForCheck();
        },
      });
  }
  fechaLegible(fecha: string): string {
    return fecha.slice(6, 8) + '/' + fecha.slice(4, 6) + '/' + fecha.slice(0, 4);
  }
}
