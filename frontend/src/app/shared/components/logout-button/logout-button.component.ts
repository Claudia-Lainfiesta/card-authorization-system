import {
    Component,
    inject
} from '@angular/core';

import {
    Router
} from '@angular/router';

import {
    AuthService
} from '../../../core/services/auth.service';


@Component({
    selector: 'app-logout-button',
    standalone: false,
    templateUrl: './logout-button.component.html',
    styleUrl: './logout-button.component.css'
})
export class LogoutButtonComponent {

    private authService =
        inject(AuthService);

    private router =
        inject(Router);


    cerrando =
        false;


    cerrarSesion(): void {

        this.cerrando =
            true;


        this.authService
            .logout()
            .subscribe({

                next: () => {

                    this.cerrando =
                        false;

                    this.router.navigate(
                        ['/login']
                    );

                },


                error: () => {

                    /*
                     * Aunque falle la petición al backend,
                     * eliminamos la sesión local.
                     */

                    this.authService
                        .limpiarSesion();


                    this.cerrando =
                        false;


                    this.router.navigate(
                        ['/login']
                    );

                }

            });

    }

}