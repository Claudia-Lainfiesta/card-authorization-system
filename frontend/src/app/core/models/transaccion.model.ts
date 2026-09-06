export type TipoTransaccion =
    'CONSUMO' |
    'PAGO' |
    'REVERSO';


export type EstadoTransaccion =
    'PENDIENTE' |
    'COMPLETADA' |
    'RECHAZADA';


export interface Transaccion {

    id_transaccion: number;

    id_tarjeta: number;

    numero_tarjeta: string;

    nombre_titular: string;

    id_usuario: number;

    propietario?: string;

    tipo: TipoTransaccion;

    monto: number;

    comercio: string | null;

    estado: EstadoTransaccion;

    fecha: string;
}


export interface TransaccionesResponse {

    transacciones: Transaccion[];

}