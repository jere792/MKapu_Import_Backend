/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICashboxRepositoryPort } from '../../../../domain/ports/out/cashbox-ports-out';
import { CashboxOrmEntity } from '../../../entity/cashbox-orm.entity';
import { Cashbox } from '../../../../domain/entity/cashbox-domain-entity';

@Injectable()
export class CashboxTypeOrmRepository implements ICashboxRepositoryPort {
  constructor(
    @InjectRepository(CashboxOrmEntity)
    private readonly repository: Repository<CashboxOrmEntity>,
  ) {}

  private mapToDomain(orm: CashboxOrmEntity): Cashbox {
    return new Cashbox(
      orm.id_caja,
      orm.id_sede_ref,
      orm.estado as any,
      orm.fec_apertura,
      orm.fec_cierre,
      orm.monto_inicial ?? null,
    );
  }

  async save(cashbox: Cashbox): Promise<Cashbox> {
    const ormEntity = this.repository.create({
      id_caja: cashbox.id_caja,
      id_sede_ref: cashbox.id_sede_ref,
      estado: cashbox.estado,
      fec_apertura: cashbox.fec_apertura,
      fec_cierre: cashbox.fec_cierre,
      monto_inicial: cashbox.monto_inicial ?? null,
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async update(cashbox: Cashbox): Promise<Cashbox> {
    await this.repository.update(cashbox.id_caja, {
      estado: cashbox.estado,
      fec_cierre: cashbox.fec_cierre,
    });
    return cashbox;
  }

  async findById(id_caja: string): Promise<Cashbox | null> {
    const orm = await this.repository.findOne({ where: { id_caja } });
    return orm ? this.mapToDomain(orm) : null;
  }

  async findActiveBySede(id_sede_ref: number): Promise<Cashbox | null> {
    const orm = await this.repository.findOne({
      where: { id_sede_ref, estado: 'ABIERTA' as any },
    });
    return orm ? this.mapToDomain(orm) : null;
  }

  async existsActiveInSede(id_sede_ref: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { id_sede_ref, estado: 'ABIERTA' as any },
    });
    return count > 0;
  }

  async getResumenDia(idSede: number): Promise<any> {
    const [resumen, caja, ventasPorHora, kpiVentas, ingresosPorMetodo] =
      await Promise.all([
        // ── Movimientos de caja ─────────────────────────────────────────────
        this.repository.manager.query(
          `
        SELECT
          COUNT(m.id_movimiento)                                                      AS totalVentas,
          COALESCE(SUM(m.monto), 0)                                                   AS totalMonto,
          COALESCE(AVG(m.monto), 0)                                                   AS ticketPromedio,
          COALESCE(SUM(CASE WHEN m.tipo_mov = 'INGRESO' THEN m.monto ELSE 0 END), 0) AS totalIngresos,
          COALESCE(SUM(CASE WHEN m.tipo_mov = 'EGRESO'  THEN m.monto ELSE 0 END), 0) AS totalEgresos
        FROM movimiento_caja m
        INNER JOIN caja c ON m.id_caja = c.id_caja
        WHERE c.id_sede_ref = ?
          AND c.estado = 'ABIERTA'
          AND DATE(m.fecha) = CURDATE()
      `,
          [idSede],
        ),

        // ── Caja activa ─────────────────────────────────────────────────────
        this.repository.manager.query(
          `
        SELECT COALESCE(monto_inicial, 0) AS monto_inicial, id_caja
        FROM caja
        WHERE id_sede_ref = ? AND estado = 'ABIERTA'
        LIMIT 1
      `,
          [idSede],
        ),

        // ── Ventas agrupadas por hora ───────────────────────────────────────
        this.repository.manager.query(
          `
        SELECT
          DATE_FORMAT(m.fecha, '%H:00') AS hora,
          COALESCE(SUM(m.monto), 0)     AS total
        FROM movimiento_caja m
        INNER JOIN caja c ON m.id_caja = c.id_caja
        WHERE c.id_sede_ref = ?
          AND c.estado = 'ABIERTA'
          AND m.tipo_mov = 'INGRESO'
          AND DATE(m.fecha) = CURDATE()
        GROUP BY DATE_FORMAT(m.fecha, '%H:00')
        ORDER BY hora ASC
      `,
          [idSede],
        ),

        // ── Ganancia bruta y cant. productos desde comprobantes ─────────────
        this.repository.manager.query(
          `
        SELECT
          COALESCE(SUM(d.cantidad * (d.pre_uni - d.valor_uni)), 0) AS gananciaBruta,
          COALESCE(SUM(d.cantidad), 0)                             AS cantProductos
        FROM detalle_comprobante d
        INNER JOIN comprobante_venta c ON d.id_comprobante = c.id_comprobante
        WHERE c.id_sede_ref = ?
          AND c.estado = 'EMITIDO'
          AND DATE(c.fec_emision) = CURDATE()
      `,
          [idSede],
        ),

        this.repository.manager.query(
          `
        SELECT
          tp.cod_tipo_sunat,
          COALESCE(SUM(m.monto), 0) AS total
        FROM movimiento_caja m
        INNER JOIN caja c ON m.id_caja = c.id_caja
        INNER JOIN tipo_pago tp ON m.id_tipo_pago = tp.id_tipo_pago
        WHERE c.id_sede_ref = ?
          AND c.estado = 'ABIERTA'
          AND m.tipo_mov = 'INGRESO'
          AND DATE(m.fecha) = CURDATE()
        GROUP BY tp.cod_tipo_sunat
      `,
          [idSede],
        ),
      ]);

    const montoInicial = Number(caja[0]?.monto_inicial ?? 0);
    const totalEgresos = Number(resumen[0]?.totalEgresos ?? 0);

    const ingresoEfectivo = ingresosPorMetodo
      .filter((r: any) => r.cod_tipo_sunat === '008')
      .reduce((sum: number, r: any) => sum + Number(r.total), 0);

    const ingresoVirtual = ingresosPorMetodo
      .filter((r: any) => r.cod_tipo_sunat !== '008')
      .reduce((sum: number, r: any) => sum + Number(r.total), 0);

    const dineroEnCaja = montoInicial + ingresoEfectivo - totalEgresos;
    const saldoVirtual = ingresoVirtual;

    // Mapa completo 08:00–20:00
    const mapaHoras = new Map<string, number>();
    for (let h = 8; h <= 20; h++) {
      mapaHoras.set(`${h.toString().padStart(2, '0')}:00`, 0);
    }
    for (const row of ventasPorHora) {
      mapaHoras.set(row.hora, Number(row.total));
    }

    return {
      totalVentas: Number(resumen[0]?.totalVentas ?? 0),
      totalMonto: Number(resumen[0]?.totalMonto ?? 0),
      ticketPromedio: Number(resumen[0]?.ticketPromedio ?? 0),
      gananciaBruta: Number(kpiVentas[0]?.gananciaBruta ?? 0),
      cantProductos: Number(kpiVentas[0]?.cantProductos ?? 0),
      montoInicial,
      dineroEnCaja,
      saldoVirtual,
      ventasPorHora: Array.from(mapaHoras.entries()).map(([hora, total]) => ({
        hora,
        total,
      })),
    };
  }

  async getHistorialBySede(idSede: number): Promise<any[]> {
    return await this.repository.manager.query(
      `
      SELECT id_caja, id_sede_ref, estado, fec_apertura, fec_cierre, monto_inicial
      FROM caja
      WHERE id_sede_ref = ?
      ORDER BY fec_apertura DESC
      LIMIT 30
    `,
      [idSede],
    );
  }

  async getResumenDiaByCajaId(idCaja: string): Promise<any> {
    const [resumen, caja, ventasPorHora, kpiVentas, ingresosPorMetodo] =
      await Promise.all([
        this.repository.manager.query(
          `
        SELECT
          COUNT(m.id_movimiento)                                                      AS totalVentas,
          COALESCE(SUM(m.monto), 0)                                                   AS totalMonto,
          COALESCE(AVG(m.monto), 0)                                                   AS ticketPromedio,
          COALESCE(SUM(CASE WHEN m.tipo_mov = 'INGRESO' THEN m.monto ELSE 0 END), 0) AS totalIngresos,
          COALESCE(SUM(CASE WHEN m.tipo_mov = 'EGRESO'  THEN m.monto ELSE 0 END), 0) AS totalEgresos
        FROM movimiento_caja m
        WHERE m.id_caja = ?
      `,
          [idCaja],
        ),

        this.repository.manager.query(
          `
        SELECT COALESCE(monto_inicial, 0) AS monto_inicial, id_sede_ref
        FROM caja WHERE id_caja = ? LIMIT 1
      `,
          [idCaja],
        ),

        this.repository.manager.query(
          `
        SELECT DATE_FORMAT(m.fecha, '%H:00') AS hora, COALESCE(SUM(m.monto), 0) AS total
        FROM movimiento_caja m
        WHERE m.id_caja = ? AND m.tipo_mov = 'INGRESO'
        GROUP BY DATE_FORMAT(m.fecha, '%H:00')
        ORDER BY hora ASC
      `,
          [idCaja],
        ),

        this.repository.manager.query(
          `
        SELECT
          COALESCE(SUM(d.cantidad * (d.pre_uni - d.valor_uni)), 0) AS gananciaBruta,
          COALESCE(SUM(d.cantidad), 0)                             AS cantProductos
        FROM detalle_comprobante d
        INNER JOIN comprobante_venta cv ON d.id_comprobante = cv.id_comprobante
        INNER JOIN caja c ON cv.id_sede_ref = c.id_sede_ref
        WHERE c.id_caja = ?
          AND cv.estado = 'EMITIDO'
          AND DATE(cv.fec_emision) = (SELECT DATE(fec_apertura) FROM caja WHERE id_caja = ?)
      `,
          [idCaja, idCaja],
        ),

        this.repository.manager.query(
          `
        SELECT tp.cod_tipo_sunat, COALESCE(SUM(m.monto), 0) AS total
        FROM movimiento_caja m
        INNER JOIN tipo_pago tp ON m.id_tipo_pago = tp.id_tipo_pago
        WHERE m.id_caja = ? AND m.tipo_mov = 'INGRESO'
        GROUP BY tp.cod_tipo_sunat
      `,
          [idCaja],
        ),
      ]);

    const montoInicial = Number(caja[0]?.monto_inicial ?? 0);
    const totalEgresos = Number(resumen[0]?.totalEgresos ?? 0);
    const ingresoEfectivo = ingresosPorMetodo
      .filter((r: any) => r.cod_tipo_sunat === '008')
      .reduce((s: number, r: any) => s + Number(r.total), 0);
    const ingresoVirtual = ingresosPorMetodo
      .filter((r: any) => r.cod_tipo_sunat !== '008')
      .reduce((s: number, r: any) => s + Number(r.total), 0);

    const mapaHoras = new Map<string, number>();
    for (let h = 8; h <= 20; h++)
      mapaHoras.set(`${h.toString().padStart(2, '0')}:00`, 0);
    for (const row of ventasPorHora) mapaHoras.set(row.hora, Number(row.total));

    return {
      totalVentas: Number(resumen[0]?.totalVentas ?? 0),
      totalMonto: Number(resumen[0]?.totalMonto ?? 0),
      ticketPromedio: Number(resumen[0]?.ticketPromedio ?? 0),
      gananciaBruta: Number(kpiVentas[0]?.gananciaBruta ?? 0),
      cantProductos: Number(kpiVentas[0]?.cantProductos ?? 0),
      montoInicial,
      dineroEnCaja: montoInicial + ingresoEfectivo - totalEgresos,
      saldoVirtual: ingresoVirtual,
      ventasPorHora: Array.from(mapaHoras.entries()).map(([hora, total]) => ({
        hora,
        total,
      })),
    };
  }
}
