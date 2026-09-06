import {
    PLATFORM_ID,
    inject
} from '@angular/core';

import {
    isPlatformBrowser
} from '@angular/common';

import {
    HttpInterceptorFn
} from '@angular/common/http';

import {
    environment
} from '../../../environments/environment';


export const jwtInterceptor:
    HttpInterceptorFn =
    (
        req,
        next
    ) => {

        const platformId =
            inject(
                PLATFORM_ID
            );


        const esNavegador =
            isPlatformBrowser(
                platformId
            );


        const esApiInterna =
            req.url.startsWith(
                environment.apiUrl
            );


        if (
            !esApiInterna
        ) {

            return next(
                req
            );

        }


        let solicitud =
            req.clone({

                withCredentials:
                    true

            });


        if (
            !esNavegador
        ) {

            return next(
                solicitud
            );

        }


        const token =
            sessionStorage
                .getItem(
                    'accessToken'
                );


        if (
            token &&
            !req.url.includes(
                '/auth/login'
            ) &&
            !req.url.includes(
                '/auth/registro'
            ) &&
            !req.url.includes(
                '/auth/refresh'
            )
        ) {

            solicitud =
                solicitud.clone({

                    setHeaders: {

                        Authorization:
                            `Bearer ${token}`

                    }

                });

        }


        return next(
            solicitud
        );

    };