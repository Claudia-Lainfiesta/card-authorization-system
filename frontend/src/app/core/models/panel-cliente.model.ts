import { TipoTransaccion } from './transaccion.model';

export type PeriodoHistorial = 'TODOS' | '30' | '90' | 'ANIO';

export interface FiltrosHistorial {
  tarjeta: string;
  tipo: TipoTransaccion | '';
  periodo: PeriodoHistorial;
}

export interface AlertaTarjeta {
  idTarjeta: number;
  numero: string;
  mensaje: string;
  estado: 'BLOQUEADA' | 'VENCE_PRONTO' | 'SALDO_BAJO';
}
