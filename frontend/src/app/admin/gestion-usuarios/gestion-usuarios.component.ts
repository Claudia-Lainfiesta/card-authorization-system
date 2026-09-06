import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  UsuariosService
} from '../../core/services/usuarios.service';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  RolUsuario,
  Usuario
} from '../../core/models/usuario.model';


@Component({
  selector: 'app-gestion-usuarios',
  standalone: false,
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css'
})
export class GestionUsuariosComponent
  implements OnInit {

  private usuariosService =
    inject(UsuariosService);

  private authService =
    inject(AuthService);

  private cdr =
    inject(ChangeDetectorRef);


  usuarios: Usuario[] = [];

  cargando =
    false;

  error =
    '';

  mensaje =
    '';


  usuarioActualId =
    this.authService
      .obtenerUsuario()
      ?.id_usuario;


  ngOnInit(): void {

    this.cargarUsuarios();

  }


  cargarUsuarios(): void {

    this.cargando =
      true;

    this.error =
      '';


    this.usuariosService
      .listar()
      .subscribe({

        next:
          (
            respuesta
          ) => {

            this.usuarios =
              respuesta.usuarios;

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
              'No fue posible cargar los usuarios';

            this.cdr
              .markForCheck();

          }

      });

  }


  cambiarRol(
    usuario: Usuario,
    nuevoRol: string
  ): void {

    if (
      usuario.id_usuario ===
      this.usuarioActualId
    ) {

      this.error =
        'No puedes cambiar tu propio rol desde esta pantalla';

      return;

    }


    const rol =
      nuevoRol as RolUsuario;


    this.usuariosService
      .cambiarRol(
        usuario.id_usuario,
        rol
      )
      .subscribe({

        next:
          () => {

            this.mensaje =
              'Rol actualizado correctamente';

            this.error =
              '';

            this.cargarUsuarios();

          },

        error:
          (
            error
          ) => {

            this.error =
              error.error?.error ||
              'No fue posible actualizar el rol';

          }

      });

  }

}