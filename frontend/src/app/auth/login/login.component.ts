import {
    Component,
    inject
} from '@angular/core';

import {
    FormBuilder,
    Validators
} from '@angular/forms';

import {
    Router
} from '@angular/router';

import {
    AuthService
} from '../../core/services/auth.service';


@Component({
    selector: 'app-login',
    standalone: false,
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {

    private fb =
        inject(FormBuilder);

    private authService =
        inject(AuthService);

    private router =
        inject(Router);


    cargando =
        false;

    error =
        '';


    formulario =
        this.fb.group({

            correo: [
                '',
                [
                    Validators.required,
                    Validators.email
                ]
            ],

            password: [
                '',
                [
                    Validators.required
                ]
            ]

        });


    iniciarSesion(): void {

        this.error = '';


        if (
            this.formulario.invalid
        ) {

            this.formulario
                .markAllAsTouched();

            return;

        }


        this.cargando =
            true;


        const {
            correo,
            password
        } =
            this.formulario
                .getRawValue();


        this.authService
            .login(
                correo!,
                password!
            )
            .subscribe({

                next:
                    (
                        respuesta
                    ) => {

                        this.cargando =
                            false;


                        if (
                            respuesta.usuario.rol ===
                            'ADMINISTRADOR'
                        ) {

                            this.router.navigate(
                                ['/admin']
                            );

                        } else {

                            this.router.navigate(
                                ['/cliente']
                            );

                        }

                    },


                error:
                    (
                        error
                    ) => {

                        this.cargando =
                            false;


                        this.error =
                            error.error?.error ||
                            'No fue posible iniciar sesion';

                    }

            });

    }

}