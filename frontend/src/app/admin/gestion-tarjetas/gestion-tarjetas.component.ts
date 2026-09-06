import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  Validators
} from '@angular/forms';

import {
  TarjetasService
} from '../../core/services/tarjetas.service';

import {
  UsuariosService
} from '../../core/services/usuarios.service';

import {
  EstadoTarjeta,
  Tarjeta
} from '../../core/models/tarjeta.model';

import {
  Usuario
} from '../../core/models/usuario.model';


@Component({
  selector: 'app-gestion-tarjetas',
  standalone: false,
  templateUrl: './gestion-tarjetas.component.html',
  styleUrl: './gestion-tarjetas.component.css'
})
export class GestionTarjetasComponent
  implements OnInit {

  private fb =
    inject(FormBuilder);

  private tarjetasService =
    inject(TarjetasService);

  private usuariosService =
    inject(UsuariosService);

  private cdr =
    inject(ChangeDetectorRef);


  tarjetas: Tarjeta[] = [];

  usuarios: Usuario[] = [];

  cargando =
    false;

  error =
    '';

  mensaje =
    '';

  mostrandoFormulario =
    false;

  tarjetaEditando:
    Tarjeta | null =
    null;


  estados:
    EstadoTarjeta[] = [

      'ACTIVA',

      'BLOQUEADA',

      'VENCIDA',

      'CANCELADA'

    ];


  formularioCreacion =
    this.fb.group({

      numero_tarjeta: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^4[0-9]{15}$/
          )
        ]
      ],

      nombre_titular: [
        '',
        [
          Validators.required,
          Validators.minLength(3)
        ]
      ],

      cvv: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9]{3}$/
          )
        ]
      ],

      fecha_vencimiento: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9]{6}$/
          )
        ]
      ],

      monto_autorizado: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      monto_disponible: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      id_usuario: [
        null as number | null,
        Validators.required
      ],

      id_emisor: [
        'BANCO-DEMO-0001',
        Validators.required
      ],

      estado: [
        'ACTIVA' as EstadoTarjeta,
        Validators.required
      ]

    });


  formularioEdicion =
    this.fb.group({

      monto_autorizado: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      monto_disponible: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      estado: [
        'ACTIVA' as EstadoTarjeta,
        Validators.required
      ]

    });


  ngOnInit(): void {

    this.cargarTarjetas();

    this.cargarUsuarios();

  }


  cargarTarjetas(): void {

    this.cargando =
      true;

    this.error =
      '';


    this.tarjetasService
      .listarTodas()
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
              'No fue posible cargar las tarjetas';

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

            this.usuarios =
              respuesta.usuarios;

            this.cdr
              .markForCheck();

          },

        error:
          () => {

            this.error =
              'No fue posible cargar los usuarios';

          }

      });

  }


  abrirFormularioCreacion(): void {

    this.mostrandoFormulario =
      !this.mostrandoFormulario;

    this.tarjetaEditando =
      null;

    this.mensaje =
      '';

    this.error =
      '';

  }


  crearTarjeta(): void {

    if (
      this.formularioCreacion.invalid
    ) {

      this.formularioCreacion
        .markAllAsTouched();

      return;

    }


    const datos =
      this.formularioCreacion
        .getRawValue();


    this.tarjetasService
      .crear({

        numero_tarjeta:
          datos.numero_tarjeta!,

        nombre_titular:
          datos.nombre_titular!,

        cvv:
          datos.cvv!,

        fecha_vencimiento:
          datos.fecha_vencimiento!,

        monto_autorizado:
          Number(
            datos.monto_autorizado
          ),

        monto_disponible:
          Number(
            datos.monto_disponible
          ),

        id_usuario:
          Number(
            datos.id_usuario
          ),

        id_emisor:
          datos.id_emisor!,

        estado:
          datos.estado!

      })
      .subscribe({

        next:
          () => {

            this.mensaje =
              'Tarjeta creada correctamente';

            this.mostrandoFormulario =
              false;


            this.formularioCreacion
              .reset({

                numero_tarjeta:
                  '',

                nombre_titular:
                  '',

                cvv:
                  '',

                fecha_vencimiento:
                  '',

                monto_autorizado:
                  0,

                monto_disponible:
                  0,

                id_usuario:
                  null,

                id_emisor:
                  'BANCO-DEMO-0001',

                estado:
                  'ACTIVA'

              });


            this.cargarTarjetas();

          },

        error:
          (
            error
          ) => {

            this.error =
              error.error?.error ||
              'No fue posible crear la tarjeta';

          }

      });

  }


  editar(
    tarjeta: Tarjeta
  ): void {

    this.tarjetaEditando =
      tarjeta;

    this.mostrandoFormulario =
      false;

    this.error =
      '';

    this.mensaje =
      '';


    this.formularioEdicion
      .setValue({

        monto_autorizado:
          tarjeta.monto_autorizado,

        monto_disponible:
          tarjeta.monto_disponible,

        estado:
          tarjeta.estado

      });

  }


  guardarEdicion(): void {

    if (
      !this.tarjetaEditando ||
      this.formularioEdicion.invalid
    ) {

      return;

    }


    const datos =
      this.formularioEdicion
        .getRawValue();


    this.tarjetasService
      .actualizar(
        this.tarjetaEditando
          .id_tarjeta,
        {

          monto_autorizado:
            Number(
              datos.monto_autorizado
            ),

          monto_disponible:
            Number(
              datos.monto_disponible
            ),

          estado:
            datos.estado!

        }
      )
      .subscribe({

        next:
          () => {

            this.mensaje =
              'Tarjeta actualizada correctamente';

            this.tarjetaEditando =
              null;

            this.cargarTarjetas();

          },

        error:
          (
            error
          ) => {

            this.error =
              error.error?.error ||
              'No fue posible actualizar la tarjeta';

          }

      });

  }


  cancelarEdicion(): void {

    this.tarjetaEditando =
      null;

  }


  cancelarTarjeta(
    tarjeta: Tarjeta
  ): void {

    const confirmar =
      window.confirm(
        `¿Deseas cancelar la tarjeta ${tarjeta.numero_tarjeta}?`
      );


    if (!confirmar) {

      return;

    }


    this.tarjetasService
      .cancelar(
        tarjeta.id_tarjeta
      )
      .subscribe({

        next:
          () => {

            this.mensaje =
              'Tarjeta cancelada correctamente';

            this.cargarTarjetas();

          },

        error:
          (
            error
          ) => {

            this.error =
              error.error?.error ||
              'No fue posible cancelar la tarjeta';

          }

      });

  }

}