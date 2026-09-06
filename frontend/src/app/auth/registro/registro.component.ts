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
    selector: 'app-registro',
    standalone: false,
    templateUrl: './registro.component.html',
    styleUrl: './registro.component.css'
})
export class RegistroComponent {

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

            nombre_completo: [
                '',
                [
                    Validators.required,
                    Validators.minLength(3)
                ]
            ],

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
                    Validators.required,
                    Validators.minLength(8)
                ]
            ]

        });


    registrarse(): void {

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


        const datos =
            this.formulario
                .getRawValue();


        this.authService
            .registro(
                datos.nombre_completo!,
                datos.correo!,
                datos.password!
            )
            .subscribe({

                next:
                    () => {

                        this.cargando =
                            false;


                        this.router.navigate(
                            ['/login']
                        );

                    },


                error:
                    (
                        error
                    ) => {

                        this.cargando =
                            false;


                        this.error =
                            error.error?.error ||
                            'No fue posible completar el registro';

                    }

            });

    }

}