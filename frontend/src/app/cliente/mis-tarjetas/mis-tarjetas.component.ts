import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TarjetasService } from '../../core/services/tarjetas.service';
import { PanelClienteService } from '../../core/services/panel-cliente.service';
import { Tarjeta } from '../../core/models/tarjeta.model';

interface SeccionTarjetas {
  titulo: string;
  tarjetas: Tarjeta[];
}

@Component({
  selector: 'app-mis-tarjetas',
  standalone: false,
  templateUrl: './mis-tarjetas.component.html',
  styleUrl: './mis-tarjetas.component.css',
})
export class MisTarjetasComponent implements OnInit {
  private tarjetasService = inject(TarjetasService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  readonly panel = inject(PanelClienteService);
  tarjetas: Tarjeta[] = [];
  cargando = true;
  error = '';
  readonly guardandoFavoritas = new Set<number>();
  readonly erroresFavoritas = new Map<number, string>();

  get secciones(): SeccionTarjetas[] {
    const favoritas = this.tarjetas.filter((tarjeta) => tarjeta.favorita);
    return [
      ...(favoritas.length ? [{ titulo: 'Favoritas', tarjetas: favoritas }] : []),
      { titulo: 'Todas mis tarjetas', tarjetas: this.tarjetas },
    ];
  }

  identificarSeccion(_indice: number, seccion: SeccionTarjetas): string {
    return seccion.titulo;
  }

  identificarTarjeta(_indice: number, tarjeta: Tarjeta): number {
    return tarjeta.id_tarjeta;
  }

  alternarFavorita(tarjeta: Tarjeta): void {
    if (this.guardandoFavoritas.has(tarjeta.id_tarjeta)) return;

    const anterior = tarjeta.favorita === true;
    this.guardandoFavoritas.add(tarjeta.id_tarjeta);
    this.erroresFavoritas.delete(tarjeta.id_tarjeta);
    // Ambas secciones usan la misma tarjeta; la preferencia cambia de inmediato.
    tarjeta.favorita = !anterior;
    this.tarjetasService
      .actualizarFavorita(tarjeta.id_tarjeta, tarjeta.favorita)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.guardandoFavoritas.delete(tarjeta.id_tarjeta);
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (respuesta) => {
          tarjeta.favorita = respuesta.tarjeta.favorita;
          this.cdr.markForCheck();
        },
        error: () => {
          tarjeta.favorita = anterior;
          this.erroresFavoritas.set(
            tarjeta.id_tarjeta,
            `No fue posible actualizar la favorita de tu tarjeta ${this.panel.tarjetaResumida(tarjeta.numero_tarjeta)}. Inténtalo de nuevo.`,
          );
          this.cdr.markForCheck();
        },
      });
  }

  ngOnInit(): void {
    this.cargarTarjetas();
  }

  cargarTarjetas(): void {
    this.cargando = true;
    this.error = '';
    this.tarjetasService
      .listarMias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.tarjetas = respuesta.tarjetas;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.error = 'No fue posible cargar tus tarjetas';
          this.cdr.markForCheck();
        },
      });
  }
}
