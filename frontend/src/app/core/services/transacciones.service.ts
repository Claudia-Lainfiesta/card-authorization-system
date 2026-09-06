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
    TransaccionesResponse
} from '../models/transaccion.model';


@Injectable({
    providedIn: 'root'
})
export class TransaccionesService {

    private readonly apiUrl =
        `${environment.apiUrl}/transacciones`;


    constructor(
        private http: HttpClient
    ) {}


    listarMias():
        Observable<TransaccionesResponse> {

        return this.http.get<TransaccionesResponse>(
            `${this.apiUrl}/mias`
        );

    }

}