/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import {
  ISalesReceiptRepositoryPort,
  SalesReceiptKpiRaw,
  SalesReceiptSummaryRaw,
} from '../../../../domain/ports/out/sales_receipt-ports-out';
import { SalesReceipt } from '../../../../domain/entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../entity/sales-receipt-orm.entity';
import { SalesReceiptMapper } from '../../../../application/mapper/sales-receipt.mapper';
import { PaymentOrmEntity } from '../../../entity/payment-orm.entity';
import { PaymentTypeOrmEntity } from '../../../entity/payment-type-orm.entity';

@Injectable()
export class SalesReceiptRepository implements ISalesReceiptRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptOrmRepository: Repository<SalesReceiptOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  getQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  async getNextNumberWithLock(
    serie: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const lastReceipt = await queryRunner.manager
      .createQueryBuilder(SalesReceiptOrmEntity, 'receipt')
      .where('receipt.serie = :serie', { serie })
      .orderBy('receipt.numero', 'DESC')
      .getOne();
    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }

  async save(receipt: SalesReceipt): Promise<SalesReceipt> {
    const receiptOrm = SalesReceiptMapper.toOrm(receipt);
    const savedOrm = await this.receiptOrmRepository.save(receiptOrm);
    return this.findById(savedOrm.id_comprobante) as Promise<SalesReceipt>;
  }

  async findById(id: number): Promise<SalesReceipt | null> {
    const receiptOrm = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details',
        'cliente',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
      ],
    });
    return receiptOrm ? SalesReceiptMapper.toDomain(receiptOrm) : null;
  }

  async update(receipt: SalesReceipt): Promise<SalesReceipt> {
    const receiptOrm = SalesReceiptMapper.toOrm(receipt);
    const updated = await this.receiptOrmRepository.save(receiptOrm);
    return SalesReceiptMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.receiptOrmRepository.delete(id);
  }

  async findBySerie(serie: string): Promise<SalesReceipt[]> {
    const receiptsOrm = await this.receiptOrmRepository.find({
      where: { serie },
      relations: ['details'],
      order: { numero: 'DESC' },
    });
    return receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async findAll(filters?: {
    estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
    id_cliente?: string;
    id_tipo_comprobante?: number;
    fec_desde?: Date | string;
    fec_hasta?: Date | string;
    search?: string;
  }): Promise<SalesReceipt[]> {
    const query = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.details', 'details')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('receipt.tipoVenta', 'tipoVenta')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .leftJoinAndSelect('receipt.moneda', 'moneda');

    if (filters?.estado) {
      query.andWhere('receipt.estado = :estado', { estado: filters.estado });
    }
    if (filters?.fec_desde) {
      query.andWhere('receipt.fec_emision >= :fec_desde', {
        fec_desde: filters.fec_desde,
      });
    }
    if (filters?.fec_hasta) {
      const hasta = new Date(filters.fec_hasta);
      hasta.setHours(23, 59, 59, 999);
      query.andWhere('receipt.fec_emision <= :fec_hasta', { fec_hasta: hasta });
    }
    if (filters?.id_cliente) {
      query.andWhere('cliente.id_cliente = :id_cliente', {
        id_cliente: filters.id_cliente,
      });
    }
    if (filters?.id_tipo_comprobante) {
      query.andWhere('tipoComprobante.id_tipo_comprobante = :typeId', {
        typeId: filters.id_tipo_comprobante,
      });
    }
    if (filters?.search) {
      query.andWhere(
        '(receipt.serie LIKE :search OR receipt.numero LIKE :search OR cliente.razon_social LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    query.orderBy('receipt.fec_emision', 'DESC');

    const receiptsOrm = await query.getMany();
    return receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async getNextNumber(serie: string): Promise<number> {
    const lastReceipt = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }

  async updateStatus(
    id: number,
    status: string,
  ): Promise<SalesReceiptOrmEntity> {
    const dataToUpdate = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
    });
    if (!dataToUpdate) throw new Error(`Sales receipt with id ${id} not found`);
    dataToUpdate.estado = status as any;
    return this.receiptOrmRepository.save(dataToUpdate);
  }

  async findByCorrelativo(serie: string, numero: number): Promise<any | null> {
    return await this.receiptOrmRepository.findOne({
      where: { serie: serie.trim(), numero },
      relations: ['details'],
    });
  }

  async getKpiSemanal(sedeId?: number): Promise<SalesReceiptKpiRaw> {
    const ahora = new Date();
    const diaSemana = ahora.getDay();
    const diffLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - diffLunes);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const qb = this.receiptOrmRepository
      .createQueryBuilder('r')
      .where('r.fec_emision BETWEEN :desde AND :hasta', {
        desde: lunes,
        hasta: domingo,
      })
      .andWhere('r.estado = :estado', { estado: 'EMITIDO' });

    if (sedeId) qb.andWhere('r.id_sede_ref = :sedeId', { sedeId });

    qb.select([
      'COALESCE(SUM(r.total), 0)                                          AS total_ventas',
      'COUNT(r.id_comprobante)                                            AS cantidad_ventas',
      'COALESCE(SUM(CASE WHEN r.serie LIKE :boleta  THEN r.total END), 0) AS total_boletas',
      'COALESCE(SUM(CASE WHEN r.serie LIKE :factura THEN r.total END), 0) AS total_facturas',
    ]);

    const row = await qb
      .setParameter('boleta', 'B%')
      .setParameter('factura', 'F%')
      .getRawOne();

    return {
      total_ventas: Number(row?.total_ventas ?? 0),
      cantidad_ventas: Number(row?.cantidad_ventas ?? 0),
      total_boletas: Number(row?.total_boletas ?? 0),
      total_facturas: Number(row?.total_facturas ?? 0),
    };
  }
  async findAllPaginated(
    filters: {
      estado?: string;
      id_cliente?: string;
      id_tipo_comprobante?: number;
      id_metodo_pago?: number;
      fec_desde?: Date | string;
      fec_hasta?: Date | string;
      search?: string;
      sedeId?: number;
    },
    page: number,
    limit: number,
  ): Promise<[SalesReceiptSummaryRaw[], number]> {
    // ── JOIN de pago ─────────────────────────────────────────────────────────
    const pagoJoin = filters.id_metodo_pago
      ? `INNER JOIN mkp_ventas.pago p ON p.id_comprobante = r.id_comprobante AND p.id_tipo_pago = ?`
      : `LEFT  JOIN mkp_ventas.pago p ON p.id_comprobante = r.id_comprobante`;

    const joinParams: any[] = filters.id_metodo_pago
      ? [filters.id_metodo_pago]
      : [];

    // ── WHERE dinámico (sin id_metodo_pago, ya está en el JOIN) ──────────────
    const conditions: string[] = [];
    const whereParams: any[] = [];

    if (filters.estado) {
      conditions.push('r.estado = ?');
      whereParams.push(filters.estado);
    }
    if (filters.id_cliente) {
      conditions.push('c.id_cliente = ?');
      whereParams.push(filters.id_cliente);
    }
    if (filters.id_tipo_comprobante) {
      conditions.push('tc.id_tipo_comprobante = ?');
      whereParams.push(filters.id_tipo_comprobante);
    }
    if (filters.fec_desde) {
      conditions.push('r.fec_emision >= ?');
      whereParams.push(filters.fec_desde);
    }
    if (filters.fec_hasta) {
      const hasta = new Date(filters.fec_hasta);
      hasta.setHours(23, 59, 59, 999);
      conditions.push('r.fec_emision <= ?');
      whereParams.push(hasta);
    }
    if (filters.search) {
      conditions.push(
        '(r.serie LIKE ? OR CAST(r.numero AS CHAR) LIKE ? OR c.razon_social LIKE ? OR c.valor_doc LIKE ? OR c.nombres LIKE ?)',
      );
      const s = `%${filters.search}%`;
      whereParams.push(s, s, s, s, s);
    }
    if (filters.sedeId) {
      conditions.push('r.id_sede_ref = ?');
      whereParams.push(filters.sedeId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── Params finales: JOIN primero, luego WHERE ─────────────────────────────
    const allParams = [...joinParams, ...whereParams];

    const baseQuery = `
    FROM mkp_ventas.comprobante_venta r
    INNER JOIN mkp_ventas.cliente          c  ON c.id_cliente            = r.id_cliente
    INNER JOIN mkp_ventas.tipo_comprobante tc ON tc.id_tipo_comprobante  = r.id_tipo_comprobante
    ${pagoJoin}
    LEFT  JOIN mkp_ventas.tipo_pago        tp ON tp.id_tipo_pago         = p.id_tipo_pago
    ${whereClause}
  `;

    // ── Conteo ───────────────────────────────────────────────────────────────
    const countResult = await this.dataSource.query(
      `SELECT COUNT(DISTINCT r.id_comprobante) AS total ${baseQuery}`,
      allParams,
    );
    const total = Number(countResult[0]?.total ?? 0);

    // ── Datos paginados ───────────────────────────────────────────────────────
    const offset = (page - 1) * limit;
    const rows = await this.dataSource.query(
      `SELECT
      r.id_comprobante,
      r.serie,
      r.numero,
      tc.descripcion                                                                                                                   AS tipo_comprobante,
      r.fec_emision,
      COALESCE(NULLIF(TRIM(c.razon_social),''), NULLIF(TRIM(CONCAT(COALESCE(c.nombres,''),' ',COALESCE(c.apellidos,''))), ''), '—')   AS cliente_nombre,
      COALESCE(c.valor_doc, '—')                                                                                                      AS cliente_doc,
      r.id_responsable_ref                                                                                                            AS id_responsable,
      r.id_sede_ref                                                                                                                   AS id_sede,
      COALESCE(tp.descripcion, 'N/A')                                                                                                 AS metodo_pago,
      r.total,
      r.estado
    ${baseQuery}
    ORDER BY r.fec_emision DESC
    LIMIT ? OFFSET ?`,
      [...allParams, limit, offset],
    );

    return [
      rows.map((r: any) => ({
        id_comprobante: Number(r.id_comprobante),
        serie: r.serie,
        numero: Number(r.numero),
        tipo_comprobante: r.tipo_comprobante ?? '—',
        fec_emision: r.fec_emision,
        cliente_nombre: r.cliente_nombre ?? '—',
        cliente_doc: r.cliente_doc ?? '—',
        id_responsable: r.id_responsable,
        id_sede: Number(r.id_sede),
        metodo_pago: r.metodo_pago ?? 'N/A',
        total: Number(r.total),
        estado: r.estado,
      })),
      total,
    ];
  }

  async findDetalleCompleto(id_comprobante: number): Promise<any> {
    const comprobante = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .leftJoin('r.cliente', 'c')
      .leftJoin('c.tipoDocumento', 'td')
      .leftJoin('r.tipoComprobante', 'tc')
      .leftJoin('pago', 'p', 'p.id_comprobante = r.id_comprobante')
      .leftJoin('tipo_pago', 'tp', 'tp.id_tipo_pago = p.id_tipo_pago')
      .select([
        'r.id_comprobante                                                                                                                               AS id_comprobante',
        'r.serie                                                                                                                                        AS serie',
        'r.numero                                                                                                                                       AS numero',
        'tc.descripcion                                                                                                                                 AS tipo_comprobante',
        'r.fec_emision                                                                                                                                  AS fec_emision',
        'r.fec_venc                                                                                                                                     AS fec_venc',
        'r.subtotal                                                                                                                                     AS subtotal',
        'r.igv                                                                                                                                          AS igv',
        'r.total                                                                                                                                        AS total',
        'r.estado                                                                                                                                       AS estado',
        'r.id_responsable_ref                                                                                                                           AS id_responsable',
        'r.id_sede_ref                                                                                                                                  AS id_sede',
        'COALESCE(tp.descripcion, "N/A")                                                                                                               AS metodo_pago',
        'c.id_cliente                                                                                                                                   AS cliente_id',
        'COALESCE(NULLIF(TRIM(c.razon_social),""), NULLIF(TRIM(CONCAT(COALESCE(c.nombres,"")," ",COALESCE(c.apellidos,""))), ""), "—")                 AS cliente_nombre',
        'COALESCE(c.valor_doc,   "—")                                                                                                                  AS cliente_doc',
        'COALESCE(td.descripcion, "—")                                                                                                                 AS cliente_tipo_doc',
        'COALESCE(c.direccion,   "")                                                                                                                   AS cliente_direccion',
        'COALESCE(c.email,       "")                                                                                                                   AS cliente_email',
        'COALESCE(c.telefono,    "")                                                                                                                   AS cliente_telefono',
      ])
      .where('r.id_comprobante = :id', { id: id_comprobante })
      .getRawOne();

    if (!comprobante) return null;

    // En findDetalleCompleto, reemplazar el query de productos:
    const productos = await this.receiptOrmRepository.manager
      .createQueryBuilder()
      .select([
        'd.id_prod_ref                              AS id_prod_ref',
        'COALESCE(d.cod_prod, d.id_prod_ref)        AS cod_prod',
        'd.descripcion                              AS descripcion',
        'd.cantidad                                 AS cantidad',
        'd.pre_uni                                  AS precio_unit',
        'd.igv                                      AS igv',
        '(d.cantidad * d.pre_uni)                   AS total',
      ])
      .from('detalle_comprobante', 'd')
      .where('d.id_comprobante = :id', { id: id_comprobante })
      .getRawMany();

    const historial = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .leftJoin('pago', 'p', 'p.id_comprobante = r.id_comprobante')
      .leftJoin('tipo_pago', 'tp', 'tp.id_tipo_pago = p.id_tipo_pago')
      .select([
        'r.id_comprobante           AS id_comprobante',
        'r.serie                    AS serie',
        'r.numero                   AS numero',
        'r.fec_emision              AS fec_emision',
        'r.total                    AS total',
        'r.estado                   AS estado',
        'r.id_responsable_ref       AS id_responsable',
        'COALESCE(tp.descripcion, "N/A") AS metodo_pago',
      ])
      .where('r.id_cliente = :id_cliente', {
        id_cliente: comprobante.cliente_id,
      })
      .andWhere('r.id_comprobante != :id', { id: id_comprobante })
      .orderBy('r.fec_emision', 'DESC')
      .limit(10)
      .getRawMany();

    return { comprobante, productos, historial };
  }
}
