import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  ActualizarRolResponse,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  EliminarUsuarioResponse,
  RolUsuario,
  UsuariosResponse,
} from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<UsuariosResponse> {
    return this.http.get<UsuariosResponse>(this.apiUrl);
  }

  crear(datos: CrearUsuarioRequest): Observable<ActualizarRolResponse> {
    return this.http.post<ActualizarRolResponse>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: ActualizarUsuarioRequest): Observable<ActualizarRolResponse> {
    return this.http.put<ActualizarRolResponse>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<EliminarUsuarioResponse> {
    return this.http.delete<EliminarUsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  cambiarRol(idUsuario: number, rol: RolUsuario): Observable<ActualizarRolResponse> {
    return this.http.put<ActualizarRolResponse>(`${this.apiUrl}/${idUsuario}/rol`, {
      rol,
    });
  }
}
