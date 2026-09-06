import {
    Injectable
} from '@angular/core';

import {
    HttpClient
} from '@angular/common/http';

import {
    Observable
} from 'rxjs';

import {
    environment
} from '../../../environments/environment';

import {
    ActualizarRolResponse,
    RolUsuario,
    UsuariosResponse
} from '../models/usuario.model';


@Injectable({
    providedIn: 'root'
})
export class UsuariosService {

    private readonly apiUrl =
        `${environment.apiUrl}/usuarios`;


    constructor(
        private http: HttpClient
    ) {}


    listar():
        Observable<UsuariosResponse> {

        return this.http.get<UsuariosResponse>(
            this.apiUrl
        );

    }


    cambiarRol(
        idUsuario: number,
        rol: RolUsuario
    ): Observable<ActualizarRolResponse> {

        return this.http.put<ActualizarRolResponse>(
            `${this.apiUrl}/${idUsuario}/rol`,
            {
                rol
            }
        );

    }

}