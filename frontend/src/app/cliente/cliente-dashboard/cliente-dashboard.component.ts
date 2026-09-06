import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  TarjetasService
} from '../../core/services/tarjetas.service';

import {
  TransaccionesService
} from '../../core/services/transacciones.service';


@Component({
  selector: 'app-cliente-dashboard',
  standalone: false,
  templateUrl: './cliente-dashboard.component.html',
  styleUrl: './cliente-dashboard.component.css'
})
export class ClienteDashboardComponent
  implements OnInit {

  private authService =
    inject(AuthService);

  private tarjetasService =
    inject(TarjetasService);

  private transaccionesService =
    inject(TransaccionesService);

  private cdr =
    inject(ChangeDetectorRef);


  nombre =
    this.authService
      .obtenerUsuario()
      ?.nombre_completo ||
    'Cliente';


  totalTarjetas =
    0;

  tarjetasActivas =
    0;

  saldoDisponible =
    0;

  totalTransacciones =
    0;


  ngOnInit(): void {

    this.cargarTarjetas();

    this.cargarHistorial();

  }


  cargarTarjetas(): void {

    this.tarjetasService
      .listarMias()
      .subscribe({

        next:
          (
            respuesta
          ) => {

            this.totalTarjetas =
              respuesta.tarjetas.length;


            this.tarjetasActivas =
              respuesta.tarjetas
                .filter(
                  tarjeta =>
                    tarjeta.estado ===
                    'ACTIVA'
                )
                .length;


            this.saldoDisponible =
              respuesta.tarjetas
                .reduce(
                  (
                    total,
                    tarjeta
                  ) =>
                    total +
                    Number(
                      tarjeta.monto_disponible
                    ),
                  0
                );


            this.cdr
              .markForCheck();

          }

      });

  }


  cargarHistorial(): void {

    this.transaccionesService
      .listarMias()
      .subscribe({

        next:
          (
            respuesta
          ) => {

            this.totalTransacciones =
              respuesta.transacciones.length;


            this.cdr
              .markForCheck();

          }

      });

  }

}