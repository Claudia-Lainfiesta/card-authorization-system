export type EstadoTarjeta =
    'ACTIVA' |
    'BLOQUEADA' |
    'VENCIDA' |
    'CANCELADA';


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