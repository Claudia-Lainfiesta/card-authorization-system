export type EstadoTarjeta = 'ACTIVA' | 'BLOQUEADA' | 'VENCIDA' | 'CANCELADA';

export interface Tarjeta {
  id_tarjeta: number;

  numero_tarjeta: string;

  nombre_titular: string;

  fecha_vencimiento: string;

  monto_autorizado: number;

  monto_disponible: number;

  id_usuario: number;

  propietario: string;

  id_emisor: string;

  emisor: string;

  estado: EstadoTarjeta;

  // Preferencia incluida únicamente en las respuestas del cliente.
  favorita?: boolean;

  fecha_creacion: string;

  fecha_actualizacion: string;
}

export interface CrearTarjetaRequest {
  numero_tarjeta: string;

  nombre_titular: string;

  cvv: string;

  fecha_vencimiento: string;

  monto_autorizado: number;

  monto_disponible: number;

  id_usuario: number;

  id_emisor: string;

  estado: EstadoTarjeta;
}

export interface ActualizarTarjetaRequest {
  numero_tarjeta?: string;
  nombre_titular?: string;
  fecha_vencimiento?: string;
  cvv?: string;
  id_usuario?: number;
  id_emisor?: string;

  monto_autorizado?: number;

  monto_disponible?: number;

  estado?: EstadoTarjeta;
}

export interface TarjetasResponse {
  tarjetas: Tarjeta[];
}

export interface TarjetaResponse {
  mensaje?: string;

  tarjeta: Tarjeta;
}

export interface ActualizarFavoritaRequest {
  favorita: boolean;
}

export interface FavoritaResponse {
  mensaje: string;
  tarjeta: {
    id_tarjeta: number;
    favorita: boolean;
  };
}
