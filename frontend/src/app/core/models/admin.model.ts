export interface ResumenAdmin {
  tarjetas_activas: number;
  autorizaciones_hoy: number;
  aprobadas_hoy: number;
  tasa_aprobacion: number;
  usuarios_registrados: number;
  fecha: string;
}
export interface AutorizacionBitacora {
  id_autorizacion: number;
  fecha: string;
  hora: string;
  tienda: string;
  monto: number;
  status: 'APROBADO' | 'DENEGADO';
}
export interface BitacoraResponse {
  autorizaciones: AutorizacionBitacora[];
  total: number;
  pagina: number;
  limit: number;
}
export interface Emisor {
  id_emisor: string;
  nombre: string;
  activo: boolean;
}
