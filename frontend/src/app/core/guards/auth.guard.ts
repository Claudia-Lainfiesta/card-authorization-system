import {
    inject
} from '@angular/core';

import {
    CanActivateFn,
    Router
} from '@angular/router';

import {
    catchError,
    map,
    of
} from 'rxjs';

import {
    AuthService
} from '../services/auth.service';


export const authGuard:
    CanActivateFn =
    () => {

        const authService =
            inject(AuthService);

        const router =
            inject(Router);


        if (
            authService
                .estaAutenticado()
        ) {

            return true;

        }


        return authService
            .refreshAccessToken()
            .pipe(

                map(
                    () => true
                ),

                catchError(
                    () => {

                        authService
                            .limpiarSesion();


                        return of(
                            router.createUrlTree(
                                ['/login']
                            )
                        );

                    }
                )

            );

    };