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
    TransaccionesResponse,
    PagoResponse
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

    registrarPago(id_tarjeta: number, monto: number): Observable<PagoResponse> {
        return this.http.post<PagoResponse>(this.apiUrl, {
            id_tarjeta, monto, tipo: 'PAGO', comercio: 'Pago recibido'
        });
    }

}
