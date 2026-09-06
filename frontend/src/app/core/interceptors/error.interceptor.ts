import {
    PLATFORM_ID,
    inject
} from '@angular/core';

import {
    isPlatformBrowser
} from '@angular/common';

import {
    HttpBackend,
    HttpClient,
    HttpErrorResponse,
    HttpInterceptorFn
} from '@angular/common/http';

import {
    Router
} from '@angular/router';

import {
    catchError,
    switchMap,
    throwError
} from 'rxjs';

import {
    environment
} from '../../../environments/environment';

import {
    RefreshResponse
} from '../models/usuario.model';


export const errorInterceptor:
    HttpInterceptorFn =
    (
        req,
        next
    ) => {

        const router =
            inject(
                Router
            );


        const backend =
            inject(
                HttpBackend
            );


        const platformId =
            inject(
                PLATFORM_ID
            );


        const esNavegador =
            isPlatformBrowser(
                platformId
            );


        return next(
            req
        ).pipe(

            catchError(
                (
                    error:
                        HttpErrorResponse
                ) => {

                    const esApi =
                        req.url.startsWith(
                            environment.apiUrl
                        );


                    const esAuth =
                        req.url.includes(
                            '/auth/login'
                        ) ||
                        req.url.includes(
                            '/auth/registro'
                        ) ||
                        req.url.includes(
                            '/auth/refresh'
                        );


                    if (
                        error.status === 403
                    ) {

                        if (
                            esNavegador
                        ) {

                            router.navigate(
                                [
                                    '/acceso-denegado'
                                ]
                            );

                        }


                        return throwError(
                            () => error
                        );

                    }


                    if (
                        error.status !== 401 ||
                        !esApi ||
                        esAuth ||
                        !esNavegador
                    ) {

                        return throwError(
                            () => error
                        );

                    }


                    const httpDirecto =
                        new HttpClient(
                            backend
                        );


                    return httpDirecto
                        .post<RefreshResponse>(
                            `${environment.apiUrl}/auth/refresh`,
                            {},
                            {
                                withCredentials:
                                    true
                            }
                        )
                        .pipe(

                            switchMap(
                                (
                                    respuesta
                                ) => {

                                    sessionStorage
                                        .setItem(
                                            'accessToken',
                                            respuesta
                                                .accessToken
                                        );


                                    const reintento =
                                        req.clone({

                                            withCredentials:
                                                true,

                                            setHeaders: {

                                                Authorization:
                                                    `Bearer ${respuesta.accessToken}`

                                            }

                                        });


                                    return next(
                                        reintento
                                    );

                                }
                            ),


                            catchError(
                                (
                                    refreshError
                                ) => {

                                    sessionStorage
                                        .removeItem(
                                            'accessToken'
                                        );


                                    sessionStorage
                                        .removeItem(
                                            'usuario'
                                        );


                                    router.navigate(
                                        ['/login']
                                    );


                                    return throwError(
                                        () =>
                                            refreshError
                                    );

                                }
                            )

                        );

                }
            )

        );

    };