import { Injectable } from '@angular/core';
import { Tarjeta } from '../models/tarjeta.model';
import { Transaccion } from '../models/transaccion.model';
import { AlertaTarjeta, FiltrosHistorial } from '../models/panel-cliente.model';

@Injectable({ providedIn: 'root' })
export class PanelClienteService {
  readonly diasAvisoVencimiento = 60;
  readonly umbralSaldoBajo = 0.1;

  saludo(ahora = new Date()): string {
    const hora = ahora.getHours();
    return hora >= 6 && hora < 12
      ? 'Buenos días'
      : hora >= 12 && hora < 18
        ? 'Buenas tardes'
        : 'Buenas noches';
  }

  numeroEnmascarado(numero: string): string {
    // Los endpoints /mias ya enmascaran el PAN. Solo normalizamos su presentación.
    const ultimos = numero?.match(/(\d{4})$/)?.[1];
    return `•••• •••• •••• ${ultimos || '••••'}`;
  }

  tarjetaResumida(numero: string): string {
    return this.numeroEnmascarado(numero).slice(-9);
  }

  private finVencimiento(fecha: string): Date | null {
    if (!/^\d{4}(0[1-9]|1[0-2])$/.test(fecha)) return null;
    // La tarjeta vence al terminar el último día del mes, en hora local.
    return new Date(Number(fecha.slice(0, 4)), Number(fecha.slice(4)), 0, 23, 59, 59, 999);
  }

  vencimientoLegible(fecha: string): string {
    return this.finVencimiento(fecha) ? `${fecha.slice(4)}/${fecha.slice(2, 4)}` : 'No disponible';
  }

  vencePronto(tarjeta: Tarjeta, ahora = new Date()): boolean {
    if (tarjeta.estado !== 'ACTIVA' && tarjeta.estado !== 'BLOQUEADA') return false;
    const fin = this.finVencimiento(tarjeta.fecha_vencimiento);
    const limite = new Date(ahora);
    limite.setDate(limite.getDate() + this.diasAvisoVencimiento);
    limite.setHours(23, 59, 59, 999);
    return !!fin && fin >= ahora && fin <= limite;
  }

  porcentajeUso(tarjeta: Tarjeta): number {
    const autorizado = Number(tarjeta.monto_autorizado);
    if (autorizado <= 0) return 0;
    return Math.min(100, Math.max(0, (1 - Number(tarjeta.monto_disponible) / autorizado) * 100));
  }

  resumen(tarjetas: Tarjeta[]) {
    const activas = tarjetas.filter((tarjeta) => tarjeta.estado === 'ACTIVA');
    return {
      totalTarjetas: tarjetas.length,
      tarjetasActivas: activas.length,
      saldoDisponible: activas.reduce(
        (total, tarjeta) => total + Number(tarjeta.monto_disponible),
        0,
      ),
      montoUtilizado: tarjetas.reduce(
        (total, tarjeta) =>
          total + Number(tarjeta.monto_autorizado) - Number(tarjeta.monto_disponible),
        0,
      ),
    };
  }

  alertas(tarjetas: Tarjeta[], ahora = new Date()): AlertaTarjeta[] {
    return tarjetas.flatMap((tarjeta) => {
      const alertas: AlertaTarjeta[] = [];
      const base = {
        idTarjeta: tarjeta.id_tarjeta,
        numero: this.tarjetaResumida(tarjeta.numero_tarjeta),
      };
      if (tarjeta.estado === 'BLOQUEADA') {
        alertas.push({ ...base, estado: 'BLOQUEADA', mensaje: 'Tu tarjeta está bloqueada.' });
      }
      if (this.vencePronto(tarjeta, ahora)) {
        alertas.push({
          ...base,
          estado: 'VENCE_PRONTO',
          mensaje: `Tu tarjeta vence en los próximos ${this.diasAvisoVencimiento} días (${this.vencimientoLegible(tarjeta.fecha_vencimiento)}).`,
        });
      }
      if (
        tarjeta.estado === 'ACTIVA' &&
        (Number(tarjeta.monto_disponible) <= 0 ||
          Number(tarjeta.monto_disponible) <
            Number(tarjeta.monto_autorizado) * this.umbralSaldoBajo)
      ) {
        alertas.push({
          ...base,
          estado: 'SALDO_BAJO',
          mensaje: 'Tu tarjeta tiene menos del 10 % de saldo disponible.',
        });
      }
      return alertas;
    });
  }

  // Colores del badge Mercury existente, aplicados únicamente en las vistas del cliente.
  estiloEstado(estado: string): Record<string, string> {
    if (estado === 'ACTIVA' || estado === 'COMPLETADA') {
      return { color: '#6ee7b7', background: '#10b9810d', 'border-color': '#10b98126' };
    }
    if (estado === 'BLOQUEADA' || estado === 'RECHAZADA') {
      return { color: '#fca5a5', background: '#ef44440d', 'border-color': '#ef444426' };
    }
    if (['PENDIENTE', 'VENCE_PRONTO', 'SALDO_BAJO'].includes(estado)) {
      return { color: '#fcd34d', background: '#f59e0b0d', 'border-color': '#f59e0b26' };
    }
    return { color: '#bdbdbd', background: '#ffffff05', 'border-color': '#ffffff1a' };
  }

  concepto(transaccion: Transaccion): string {
    return transaccion.tipo === 'PAGO'
      ? 'Pago recibido'
      : transaccion.comercio || (transaccion.tipo === 'REVERSO' ? 'Reverso' : 'Consumo');
  }

  ordenar(transacciones: Transaccion[]): Transaccion[] {
    return [...transacciones].sort(
      (a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime() ||
        b.id_transaccion - a.id_transaccion,
    );
  }

  filtrar(
    transacciones: Transaccion[],
    filtros: FiltrosHistorial,
    ahora = new Date(),
  ): Transaccion[] {
    let inicio: Date | null = null;
    if (filtros.periodo === 'ANIO') inicio = new Date(ahora.getFullYear(), 0, 1);
    if (filtros.periodo === '30' || filtros.periodo === '90') {
      inicio = new Date(ahora);
      inicio.setDate(inicio.getDate() - Number(filtros.periodo) + 1);
      inicio.setHours(0, 0, 0, 0);
    }
    return transacciones.filter(
      (transaccion) =>
        (!filtros.tarjeta || String(transaccion.id_tarjeta) === filtros.tarjeta) &&
        (!filtros.tipo || transaccion.tipo === filtros.tipo) &&
        (!inicio ||
          (new Date(transaccion.fecha) >= inicio && new Date(transaccion.fecha) <= ahora)),
    );
  }
}
