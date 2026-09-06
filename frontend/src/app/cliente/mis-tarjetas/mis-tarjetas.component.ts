import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  TarjetasService
} from '../../core/services/tarjetas.service';

import {
  Tarjeta
} from '../../core/models/tarjeta.model';


@Component({
  selector: 'app-mis-tarjetas',
  standalone: false,
  templateUrl: './mis-tarjetas.component.html',
  styleUrl: './mis-tarjetas.component.css'
})
export class MisTarjetasComponent
  implements OnInit {

  private tarjetasService =
    inject(TarjetasService);

  private cdr =
    inject(ChangeDetectorRef);


  tarjetas: Tarjeta[] = [];

  cargando =
    false;

  error =
    '';


  ngOnInit(): void {

    this.cargarTarjetas();

  }


  cargarTarjetas(): void {

    this.cargando =
      true;


    this.tarjetasService
      .listarMias()
      .subscribe({

        next:
          (
            respuesta
          ) => {

            this.tarjetas =
              respuesta.tarjetas;

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
              'No fue posible cargar tus tarjetas';

            this.cdr
              .markForCheck();

          }

      });

  }

}