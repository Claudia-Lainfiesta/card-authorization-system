import {
    inject
} from '@angular/core';

import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    Router
} from '@angular/router';

import {
    AuthService
} from '../services/auth.service';


export const roleGuard:
    CanActivateFn =
    (
        route:
            ActivatedRouteSnapshot
    ) => {

        const authService =
            inject(AuthService);

        const router =
            inject(Router);


        const rolesPermitidos =
            route.data[
                'rolesPermitidos'
            ] as string[];


        const rolActual =
            authService
                .obtenerRol();


        if (
            rolActual &&
            rolesPermitidos.includes(
                rolActual
            )
        ) {

            return true;

        }


        return router.createUrlTree(
            ['/acceso-denegado']
        );

    };