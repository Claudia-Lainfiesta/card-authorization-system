import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  TransaccionesService
} from '../../core/services/transacciones.service';

import {
  Transaccion
} from '../../core/models/transaccion.model';


@Component({
  selector: 'app-mi-historial',
  standalone: false,
  templateUrl: './mi-historial.component.html',
  styleUrl: './mi-historial.component.css'
})
export class MiHistorialComponent
  implements OnInit {

  private transaccionesService =
    inject(TransaccionesService);

  private cdr =
    inject(ChangeDetectorRef);

  transacciones: Transaccion[] = [];

  cargando =
    false;

  error =
    '';


  ngOnInit(): void {

    this.cargarHistorial();

  }


  cargarHistorial(): void {

    this.cargando =
      true;


    this.transaccionesService
      .listarMias()
      .subscribe({

        next:
          (
            respuesta
          ) => {

            this.transacciones =
              respuesta.transacciones;

            this.cargando =
              false;

            this.cdr
              .markForCheck();

          },
        error:
          (
            error
          ) => {

            this.cargando =
              false;

            this.error =
              error.error?.error ||
              'No fue posible cargar tu historial';

            this.cdr
              .markForCheck();

          }

      });

  }

}