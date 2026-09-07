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
    ActualizarTarjetaRequest,
    ActualizarFavoritaRequest,
    CrearTarjetaRequest,
    FavoritaResponse,
    DatosTarjetaRevelados,
    TarjetaResponse,
    TarjetasResponse
} from '../models/tarjeta.model';


@Injectable({
    providedIn: 'root'
})
export class TarjetasService {

    private readonly apiUrl =
        `${environment.apiUrl}/tarjetas`;


    constructor(
        private http: HttpClient
    ) {}


    listarTodas():
        Observable<TarjetasResponse> {

        return this.http.get<TarjetasResponse>(
            this.apiUrl
        );

    }


    crear(
        datos: CrearTarjetaRequest
    ): Observable<TarjetaResponse> {

        return this.http.post<TarjetaResponse>(
            this.apiUrl,
            datos
        );

    }


    actualizar(
        idTarjeta: number,
        datos: ActualizarTarjetaRequest
    ): Observable<TarjetaResponse> {

        return this.http.put<TarjetaResponse>(
            `${this.apiUrl}/${idTarjeta}`,
            datos
        );

    }


    cancelar(
        idTarjeta: number
    ): Observable<TarjetaResponse> {

        return this.http.delete<TarjetaResponse>(
            `${this.apiUrl}/${idTarjeta}`
        );

    }

    buscar(busqueda: string): Observable<TarjetasResponse> {
        return this.http.post<TarjetasResponse>(`${this.apiUrl}/buscar`, { busqueda });
    }

    revelar(id: number): Observable<{ tarjeta: DatosTarjetaRevelados }> {
        return this.http.post<{ tarjeta: DatosTarjetaRevelados }>(`${this.apiUrl}/${id}/revelar`, {});
    }

    actualizarFavorita(
        idTarjeta: number,
        favorita: boolean
    ): Observable<FavoritaResponse> {
        const datos: ActualizarFavoritaRequest = { favorita };

        return this.http.patch<FavoritaResponse>(
            `${this.apiUrl}/${idTarjeta}/favorita`,
            datos
        );
    }

    listarMias():
    Observable<TarjetasResponse> {

    return this.http.get<TarjetasResponse>(
        `${this.apiUrl}/mias`
    );

}

}
