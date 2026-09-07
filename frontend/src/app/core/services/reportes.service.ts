import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResumenAdmin, BitacoraResponse, Emisor } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  resumen(): Observable<{ resumen: ResumenAdmin }> {
    return this.http.get<{ resumen: ResumenAdmin }>(environment.apiUrl + '/reportes/resumen');
  }
  bitacora(pagina = 1, limit = 10): Observable<BitacoraResponse> {
    return this.http.get<BitacoraResponse>(environment.apiUrl + '/autorizaciones/bitacora', {
      params: { pagina, limit },
    });
  }
  emisores(): Observable<{ emisores: Emisor[] }> {
    return this.http.get<{ emisores: Emisor[] }>(environment.apiUrl + '/emisores');
  }
}
