import {
    Injectable,
    PLATFORM_ID,
    inject
} from '@angular/core';

import {
    isPlatformBrowser
} from '@angular/common';

import {
    HttpClient
} from '@angular/common/http';

import {
    Observable,
    tap
} from 'rxjs';

import {
    environment
} from '../../../environments/environment';

import {
    LoginResponse,
    RefreshResponse,
    RegistroResponse,
    Usuario
} from '../models/usuario.model';


@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly apiUrl =
        `${environment.apiUrl}/auth`;


    private readonly platformId =
        inject(PLATFORM_ID);


    private readonly esNavegador =
        isPlatformBrowser(
            this.platformId
        );


    constructor(
        private http: HttpClient
    ) {}


    login(
        correo: string,
        password: string
    ): Observable<LoginResponse> {

        return this.http
            .post<LoginResponse>(
                `${this.apiUrl}/login`,
                {
                    correo,
                    password
                },
                {
                    withCredentials: true
                }
            )
            .pipe(

                tap(
                    (
                        respuesta
                    ) => {

                        this.guardarSesion(
                            respuesta.accessToken,
                            respuesta.usuario
                        );

                    }
                )

            );

    }


    registro(
        nombreCompleto: string,
        correo: string,
        password: string
    ): Observable<RegistroResponse> {

        return this.http
            .post<RegistroResponse>(
                `${this.apiUrl}/registro`,
                {
                    nombre_completo:
                        nombreCompleto,

                    correo,

                    password
                },
                {
                    withCredentials: true
                }
            );

    }


    refreshAccessToken():
        Observable<RefreshResponse> {

        return this.http
            .post<RefreshResponse>(
                `${this.apiUrl}/refresh`,
                {},
                {
                    withCredentials: true
                }
            )
            .pipe(

                tap(
                    (
                        respuesta
                    ) => {

                        if (
                            this.esNavegador
                        ) {

                            sessionStorage
                                .setItem(
                                    'accessToken',
                                    respuesta.accessToken
                                );

                        }

                    }
                )

            );

    }


    logout():
        Observable<any> {

        return this.http
            .post(
                `${this.apiUrl}/logout`,
                {},
                {
                    withCredentials: true
                }
            )
            .pipe(

                tap(
                    () => {

                        this.limpiarSesion();

                    }
                )

            );

    }


    guardarSesion(
        accessToken: string,
        usuario: Usuario
    ): void {

        if (
            !this.esNavegador
        ) {

            return;

        }


        sessionStorage.setItem(
            'accessToken',
            accessToken
        );


        sessionStorage.setItem(
            'usuario',
            JSON.stringify(
                usuario
            )
        );

    }


    obtenerToken():
        string | null {

        if (
            !this.esNavegador
        ) {

            return null;

        }


        return sessionStorage
            .getItem(
                'accessToken'
            );

    }


    obtenerUsuario():
        Usuario | null {

        if (
            !this.esNavegador
        ) {

            return null;

        }


        const usuario =
            sessionStorage
                .getItem(
                    'usuario'
                );


        if (
            !usuario
        ) {

            return null;

        }


        try {

            const datos =
                JSON.parse(
                    usuario
                ) as Usuario;


            return datos;

        } catch {

            return null;

        }

    }


    obtenerRol():
        string | null {

        const usuario =
            this.obtenerUsuario();


        if (
            usuario
        ) {

            return usuario.rol;

        }


        const payload =
            this.obtenerPayloadToken();


        return payload?.rol ?? null;

    }


    estaAutenticado():
        boolean {

        const token =
            this.obtenerToken();


        if (
            !token
        ) {

            return false;

        }


        const payload =
            this.obtenerPayloadToken();


        if (
            !payload?.exp
        ) {

            return false;

        }


        const ahora =
            Math.floor(
                Date.now() / 1000
            );


        return (
            payload.exp >
            ahora
        );

    }


    limpiarSesion():
        void {

        if (
            !this.esNavegador
        ) {

            return;

        }


        sessionStorage
            .removeItem(
                'accessToken'
            );


        sessionStorage
            .removeItem(
                'usuario'
            );

    }


    private obtenerPayloadToken():
        any | null {

        const token =
            this.obtenerToken();


        if (
            !token
        ) {

            return null;

        }


        try {

            const partes =
                token.split('.');


            if (
                partes.length !== 3
            ) {

                return null;

            }


            let base64 =
                partes[1]
                    .replace(
                        /-/g,
                        '+'
                    )
                    .replace(
                        /_/g,
                        '/'
                    );


            while (
                base64.length % 4
            ) {

                base64 += '=';

            }


            const payload =
                atob(
                    base64
                );


            return JSON.parse(
                payload
            );

        } catch {

            return null;

        }

    }

}