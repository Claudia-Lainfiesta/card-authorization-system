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
  UsuariosService
} from '../../core/services/usuarios.service';

import {
  AuthService
} from '../../core/services/auth.service';


@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent
  implements OnInit {

  private tarjetasService =
    inject(TarjetasService);

  private usuariosService =
    inject(UsuariosService);

  private authService =
    inject(AuthService);

  private cdr =
    inject(ChangeDetectorRef);


  nombre =
    this.authService
      .obtenerUsuario()
      ?.nombre_completo ||
    'Administrador';


  totalTarjetas =
    0;

  tarjetasActivas =
    0;

  tarjetasBloqueadas =
    0;

  totalUsuarios =
    0;

  totalClientes =
    0;


  ngOnInit(): void {

    this.cargarTarjetas();

    this.cargarUsuarios();

  }


  cargarTarjetas(): void {

    this.tarjetasService
      .listarTodas()
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


            this.tarjetasBloqueadas =
              respuesta.tarjetas
                .filter(
                  tarjeta =>
                    tarjeta.estado ===
                    'BLOQUEADA'
                )
                .length;

            this.cdr
              .markForCheck();

          }

      });

  }


  cargarUsuarios(): void {

    this.usuariosService
      .listar()
      .subscribe({

        next:
          (
            respuesta
          ) => {

            this.totalUsuarios =
              respuesta.usuarios.length;


            this.totalClientes =
              respuesta.usuarios
                .filter(
                  usuario =>
                    usuario.rol ===
                    'CLIENTE'
                )
                .length;

            this.cdr
              .markForCheck();

          }

      });

  }

}