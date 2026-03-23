/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Not } from 'typeorm';
import {
  EmployeeSalesRaw,
  ISalesReceiptRepositoryPort,
  SalesReceiptKpiRaw,
  SalesReceiptSummaryRaw,
} from '../../../../domain/ports/out/sales_receipt-ports-out';
import { SalesReceipt } from '../../../../domain/entity/sales-receipt-domain-entity';
import {
  SalesType,
  SalesTypeEnum,
} from '../../../../domain/entity/sale-type-domain-entity';
import { ReceiptType } from '../../../../domain/entity/receipt-type-domain-entity';
import {
  ReceiptStatusOrm,
  SalesReceiptOrmEntity,
} from '../../../entity/sales-receipt-orm.entity';
import { SalesTypeOrmEntity } from '../../../entity/sales-type-orm.entity';
import { ReceiptTypeOrmEntity } from '../../../entity/receipt-type-orm.entity';
import { SalesReceiptMapper } from '../../../../application/mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptRepository implements ISalesReceiptRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptOrmRepository: Repository<SalesReceiptOrmEntity>,

    @InjectRepository(SalesTypeOrmEntity)
    private readonly salesTypeOrmRepository: Repository<SalesTypeOrmEntity>,

    @InjectRepository(ReceiptTypeOrmEntity)
    private readonly receiptTypeOrmRepository: Repository<ReceiptTypeOrmEntity>,

    private readonly dataSource: DataSource,
  ) {}

  getQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  async getNextNumberWithLock(
    serie: string,
    queryRunner: QueryRunner,
  ): Promise<number> {
    const last = await queryRunner.manager
      .createQueryBuilder(SalesReceiptOrmEntity, 'receipt')
      .where('receipt.serie = :serie', { serie })
      .orderBy('receipt.numero', 'DESC')
      .getOne();
    return last ? Number(last.numero) + 1 : 1;
  }

  async save(receipt: SalesReceipt): Promise<SalesReceipt> {
    const orm = SalesReceiptMapper.toOrm(receipt);
    const saved = await this.receiptOrmRepository.save(orm);
    return this.findById(saved.id_comprobante) as Promise<SalesReceipt>;
  }

  async findById(id: number): Promise<SalesReceipt | null> {
    const orm = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details',
        'cliente',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
      ],
    });
    return orm ? SalesReceiptMapper.toDomain(orm) : null;
  }

  async update(receipt: SalesReceipt): Promise<SalesReceipt> {
    const orm = SalesReceiptMapper.toOrm(receipt);
    const updated = await this.receiptOrmRepository.save(orm);
    return SalesReceiptMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.receiptOrmRepository.delete(id);
  }

  async findBySerie(serie: string): Promise<SalesReceipt[]> {
    const rows = await this.receiptOrmRepository.find({
      where: { serie },
      relations: ['details'],
      order: { numero: 'DESC' },
    });
    return rows.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async findAll(filters?: {
    estado?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
    id_cliente?: string;
    id_tipo_comprobante?: number;
    fec_desde?: Date | string;
    fec_hasta?: Date | string;
    search?: string;
  }): Promise<SalesReceipt[]> {
    const qb = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.details', 'details')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('receipt.tipoVenta', 'tipoVenta')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .leftJoinAndSelect('receipt.moneda', 'moneda');

    if (filters?.estado)
      qb.andWhere('receipt.estado = :estado', { estado: filters.estado });
    if (filters?.fec_desde)
      qb.andWhere('receipt.fec_emision >= :fec_desde', {
        fec_desde: filters.fec_desde,
      });
    if (filters?.fec_hasta) {
      const hasta = new Date(filters.fec_hasta);
      hasta.setHours(23, 59, 59, 999);
      qb.andWhere('receipt.fec_emision <= :fec_hasta', { fec_hasta: hasta });
    }
    if (filters?.id_cliente)
      qb.andWhere('cliente.id_cliente = :id_cliente', {
        id_cliente: filters.id_cliente,
      });
    if (filters?.id_tipo_comprobante)
      qb.andWhere('tipoComprobante.id_tipo_comprobante = :typeId', {
        typeId: filters.id_tipo_comprobante,
      });
    if (filters?.search) {
      qb.andWhere(
        `(receipt.serie LIKE :search
          OR receipt.numero LIKE :search
          OR cliente.razon_social LIKE :search
          OR cliente.nombres LIKE :search
          OR cliente.apellidos LIKE :search
          OR CONCAT(COALESCE(cliente.nombres,''), ' ', COALESCE(cliente.apellidos,'')) LIKE :search)`,
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('receipt.fec_emision', 'DESC');
    const rows = await qb.getMany();
    return rows.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async getNextNumber(serie: string): Promise<number> {
    const last = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return last ? Number(last.numero) + 1 : 1;
  }

  async updateStatus(
    id: number,
    status: string,
  ): Promise<SalesReceiptOrmEntity> {
    const entity = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
    });
    if (!entity) throw new Error(`Sales receipt with id ${id} not found`);
    entity.estado = status as any;
    return this.receiptOrmRepository.save(entity);
  }

  async findByCorrelativo(serie: string, numero: number): Promise<any | null> {
    return this.receiptOrmRepository.findOne({
      where: { serie: serie.trim(), numero },
      relations: ['details', 'cliente'],
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
      'COALESCE(SUM(r.total), 0)                                                   AS total_ventas',
      'COUNT(r.id_comprobante)                                                    AS cantidad_ventas',
      'COALESCE(SUM(CASE WHEN r.serie LIKE :boleta  THEN r.total END), 0)         AS total_boletas',
      'COALESCE(SUM(CASE WHEN r.serie LIKE :factura THEN r.total END), 0)         AS total_facturas',
      'COUNT(CASE WHEN r.serie LIKE :boleta  THEN r.id_comprobante END)           AS cantidad_boletas',
      'COUNT(CASE WHEN r.serie LIKE :factura THEN r.id_comprobante END)           AS cantidad_facturas',
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
      cantidad_boletas: Number(row?.cantidad_boletas ?? 0),
      cantidad_facturas: Number(row?.cantidad_facturas ?? 0),
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
    const pagoJoin = filters.id_metodo_pago
      ? `INNER JOIN mkp_ventas.pago p ON p.id_comprobante = r.id_comprobante AND p.id_tipo_pago = ?`
      : `LEFT  JOIN mkp_ventas.pago p ON p.id_comprobante = r.id_comprobante`;

    const joinParams: any[] = filters.id_metodo_pago
      ? [filters.id_metodo_pago]
      : [];

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
        `(r.serie LIKE ?
          OR CAST(r.numero AS CHAR) LIKE ?
          OR c.razon_social LIKE ?
          OR c.valor_doc LIKE ?
          OR c.nombres LIKE ?
          OR c.apellidos LIKE ?
          OR CONCAT(COALESCE(c.nombres,''), ' ', COALESCE(c.apellidos,'')) LIKE ?)`,
      );
      const s = `%${filters.search}%`;
      whereParams.push(s, s, s, s, s, s, s);
    }
    if (filters.sedeId) {
      conditions.push('r.id_sede_ref = ?');
      whereParams.push(filters.sedeId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allParams = [...joinParams, ...whereParams];

    const baseQuery = `
      FROM mkp_ventas.comprobante_venta r
      INNER JOIN mkp_ventas.cliente           c   ON c.id_cliente           = r.id_cliente
      INNER JOIN mkp_ventas.tipo_comprobante  tc  ON tc.id_tipo_comprobante = r.id_tipo_comprobante
      ${pagoJoin}
      LEFT  JOIN mkp_ventas.tipo_pago         tp  ON tp.id_tipo_pago        = p.id_tipo_pago
      LEFT  JOIN mkp_ventas.cuenta_por_cobrar cpc ON cpc.id_comprobante_venta = r.id_comprobante
      ${whereClause}
    `;

    const countResult = await this.dataSource.query(
      `SELECT COUNT(DISTINCT r.id_comprobante) AS total ${baseQuery}`,
      allParams,
    );
    const total = Number(countResult[0]?.total ?? 0);

    const offset = (page - 1) * limit;
    const rows = await this.dataSource.query(
      `SELECT
         r.id_comprobante,
         r.serie,
         r.numero,
         tc.descripcion AS tipo_comprobante,
         r.fec_emision,
         COALESCE(
           NULLIF(TRIM(c.razon_social), ''),
           NULLIF(TRIM(CONCAT(COALESCE(c.nombres,''), ' ', COALESCE(c.apellidos,''))), ''),
           '—'
         ) AS cliente_nombre,
         COALESCE(c.valor_doc, '—') AS cliente_doc,
         r.id_responsable_ref       AS id_responsable,
         r.id_sede_ref              AS id_sede,
         CASE
           WHEN p.id_pago     IS NOT NULL THEN COALESCE(tp.descripcion, 'N/A')
           WHEN cpc.id_cuenta IS NOT NULL THEN 'POR DEFINIR'
           ELSE 'N/A'
         END AS metodo_pago,
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

  async findDetalleCompleto(
    id_comprobante: number,
    historialPage: number = 1,
    historialLimit: number = 5,
  ): Promise<any> {
    const comprobante = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .leftJoin('r.cliente', 'c')
      .leftJoin('c.tipoDocumento', 'td')
      .leftJoin('r.tipoComprobante', 'tc')
      .leftJoin('pago', 'p', 'p.id_comprobante = r.id_comprobante')
      .leftJoin('tipo_pago', 'tp', 'tp.id_tipo_pago  = p.id_tipo_pago')
      .select([
        'r.id_comprobante                                                                                                         AS id_comprobante',
        'r.serie                                                                                                                  AS serie',
        'r.numero                                                                                                                 AS numero',
        'tc.descripcion                                                                                                           AS tipo_comprobante',
        'r.fec_emision                                                                                                            AS fec_emision',
        'r.fec_venc                                                                                                               AS fec_venc',
        'r.subtotal                                                                                                               AS subtotal',
        'r.igv                                                                                                                    AS igv',
        'r.total                                                                                                                  AS total',
        'r.estado                                                                                                                 AS estado',
        'r.id_responsable_ref                                                                                                     AS id_responsable',
        'r.id_sede_ref                                                                                                            AS id_sede',
        'COALESCE(tp.descripcion, "N/A")                                                                                          AS metodo_pago',
        'c.id_cliente                                                                                                             AS cliente_id',
        'COALESCE(NULLIF(TRIM(c.razon_social),""), NULLIF(TRIM(CONCAT(COALESCE(c.nombres,"")," ",COALESCE(c.apellidos,""))), ""), "—") AS cliente_nombre',
        'COALESCE(c.valor_doc,    "—")                                                                                            AS cliente_doc',
        'COALESCE(td.descripcion, "—")                                                                                            AS cliente_tipo_doc',
        'COALESCE(c.direccion,    "")                                                                                             AS cliente_direccion',
        'COALESCE(c.email,        "")                                                                                             AS cliente_email',
        'COALESCE(c.telefono,     "")                                                                                             AS cliente_telefono',
      ])
      .where('r.id_comprobante = :id', { id: id_comprobante })
      .getRawOne();

    if (!comprobante) return null;

    const productos = await this.receiptOrmRepository.manager.query(
      `SELECT
         d.id_prod_ref,
         COALESCE(d.cod_prod, d.id_prod_ref) AS cod_prod,
         d.descripcion,
         d.cantidad,
         d.pre_uni                           AS precio_unit,
         d.igv,
         (d.cantidad * d.pre_uni)            AS total,
         d.id_descuento,
         d.id_detalle_remate,
         COALESCE(desc_.nombre,     '')      AS descuento_nombre,
         COALESCE(desc_.porcentaje, 0)       AS descuento_porcentaje,
         dr.pre_original                     AS remate_pre_original,
         dr.pre_remate                       AS remate_pre_remate,
         r.cod_remate                        AS remate_cod_remate
       FROM mkp_ventas.detalle_comprobante d
       LEFT JOIN mkp_ventas.descuento desc_
              ON desc_.id_descuento = d.id_descuento
             AND d.id_descuento != 0
       LEFT JOIN mkp_logistica.detalle_remate dr
              ON dr.id_detalle_remate = d.id_detalle_remate
             AND d.id_detalle_remate IS NOT NULL
       LEFT JOIN mkp_logistica.remate r
              ON r.id_remate = dr.id_remate
       WHERE d.id_comprobante = ?`,
      [id_comprobante],
    );

    const promoRow = await this.receiptOrmRepository.manager.query(
      `SELECT
         da.id_descuento,
         da.monto        AS monto_descuento,
         da.id_promocion,
         p.concepto      AS promo_concepto,
         p.tipo          AS promo_tipo,
         p.valor         AS promo_valor
       FROM mkp_ventas.descuento_aplicado da
       INNER JOIN mkp_ventas.promocion p ON p.id_promocion = da.id_promocion
       WHERE da.id_comprobante = ?
       LIMIT 1`,
      [id_comprobante],
    );

    const promo = promoRow?.[0] ?? null;
    let reglasPromo: { tipo_condicion: string; valor_condicion: string }[] = [];
    if (promo?.id_promocion) {
      reglasPromo = await this.receiptOrmRepository.manager.query(
        `SELECT tipo_condicion, valor_condicion
         FROM mkp_ventas.regla_promocion
         WHERE id_promocion = ?`,
        [promo.id_promocion],
      );
    }

    const reglasProducto = reglasPromo.filter(
      (r) => r.tipo_condicion === 'PRODUCTO',
    );
    const reglasCategoria = reglasPromo.filter(
      (r) => r.tipo_condicion === 'CATEGORIA',
    );
    const hayRestriccionItem =
      reglasProducto.length > 0 || reglasCategoria.length > 0;

    const productosEnriquecidos = productos.map((p: any) => {
      let califica = false;

      if (!promo) {
        califica = false;
      } else if (!hayRestriccionItem) {
        califica = true;
      } else {
        const calificaPorProducto =
          reglasProducto.length === 0 ||
          reglasProducto.some(
            (r) =>
              p.cod_prod === r.valor_condicion ||
              p.id_prod_ref === r.valor_condicion,
          );
        const calificaPorCategoria = reglasCategoria.length === 0 || true;
        califica = calificaPorProducto && calificaPorCategoria;
      }

      return { ...p, _califica: califica };
    });

    const baseCalificada = productosEnriquecidos
      .filter((p: any) => p._califica)
      .reduce((sum: number, p: any) => {
        const totalConIgv = Number(p.cantidad) * Number(p.precio_unit) * 1.18;
        return sum + Number((totalConIgv / 1.18).toFixed(2));
      }, 0);

    const montoPromo = promo ? Number(promo.monto_descuento) : 0;

    const productosFinales = productosEnriquecidos.map((p: any) => {
      let descuento_promo_monto: number | null = null;

      if (promo && p._califica && baseCalificada > 0) {
        const baseItem = Number(
          ((Number(p.cantidad) * Number(p.precio_unit) * 1.18) / 1.18).toFixed(
            2,
          ),
        );
        descuento_promo_monto = Number(
          ((baseItem / baseCalificada) * montoPromo).toFixed(2),
        );
      }

      const { _califica, ...rest } = p;
      return {
        ...rest,
        promocion_aplicada: p._califica && !!promo,
        descuento_promo_monto,
        descuento_promo_porcentaje: promo ? (promo.promo_valor ?? 0) : 0,
        remate:
          p.id_detalle_remate != null
            ? {
                cod_remate: p.remate_cod_remate ?? '',
                pre_original: Number(p.remate_pre_original ?? 0),
                pre_remate: Number(p.remate_pre_remate ?? 0),
              }
            : null,
      };
    });

    const historialCountRow = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .select('COUNT(r.id_comprobante) AS total')
      .where('r.id_cliente = :id_cliente', {
        id_cliente: comprobante.cliente_id,
      })
      .andWhere('r.id_comprobante != :id', { id: id_comprobante })
      .getRawOne();

    const historialTotal = Number(historialCountRow?.total ?? 0);
    const historialOffset = (historialPage - 1) * historialLimit;

    const historial = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .leftJoin('pago', 'p', 'p.id_comprobante = r.id_comprobante')
      .leftJoin('tipo_pago', 'tp', 'tp.id_tipo_pago  = p.id_tipo_pago')
      .select([
        'r.id_comprobante                 AS id_comprobante',
        'r.serie                           AS serie',
        'r.numero                          AS numero',
        'r.fec_emision                     AS fec_emision',
        'r.total                           AS total',
        'r.estado                          AS estado',
        'r.id_responsable_ref              AS id_responsable',
        'COALESCE(tp.descripcion, "N/A")   AS metodo_pago',
      ])
      .where('r.id_cliente = :id_cliente', {
        id_cliente: comprobante.cliente_id,
      })
      .andWhere('r.id_comprobante != :id', { id: id_comprobante })
      .orderBy('r.fec_emision', 'DESC')
      .limit(historialLimit)
      .offset(historialOffset)
      .getRawMany();

    const statsRow = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .select([
        'COALESCE(SUM(CASE WHEN r.estado != :anulado THEN r.total ELSE 0 END), 0) AS total_gastado',
        'COUNT(CASE WHEN r.estado != :anulado THEN 1 END)                         AS cantidad_compras',
      ])
      .where('r.id_cliente = :id_cliente', {
        id_cliente: comprobante.cliente_id,
      })
      .setParameter('anulado', 'ANULADO')
      .getRawOne();

    return {
      comprobante,
      productos: productosFinales,
      historial,
      historialTotal,
      historialPage,
      historialLimit,
      statsCliente: {
        total_gastado: Number(statsRow?.total_gastado ?? 0),
        cantidad_compras: Number(statsRow?.cantidad_compras ?? 0),
      },
      promocion: promo
        ? {
            id: Number(promo.id_promocion),
            codigo: promo.promo_concepto ?? '',
            nombre: promo.promo_concepto ?? '',
            tipo: promo.promo_tipo ?? '',
            monto_descuento: Number(promo.monto_descuento ?? 0),
            descuento_nombre: '',
            descuento_porcentaje: Number(promo.promo_valor ?? 0),
            reglas: reglasPromo.map((r: any) => ({
              idRegla: 0,
              tipoCondicion: r.tipo_condicion,
              valorCondicion: r.valor_condicion,
            })),
            productosIds: reglasPromo
              .filter((r: any) => r.tipo_condicion === 'PRODUCTO')
              .map((r: any) => r.valor_condicion),
          }
        : null,
    };
  }

  async findEmployeeSalesPaginated(
    filters: {
      userId: number;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number,
  ): Promise<[EmployeeSalesRaw[], number]> {
    const query = this.receiptOrmRepository
      .createQueryBuilder('r')
      .leftJoin('r.cliente', 'c')
      .where('r.id_responsable_ref = :userId', {
        userId: String(filters.userId),
      });

    if (filters.dateFrom) {
      query.andWhere('r.fec_emision >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere('r.fec_emision <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    const total = await query.getCount();
    const rows = await query
      .clone()
      .select([
        'r.id_comprobante AS id_comprobante',
        'r.serie AS serie',
        'r.numero AS numero',
        'r.fec_emision AS fec_emision',
        'r.total AS total',
        'r.estado AS estado',
        'COALESCE(NULLIF(TRIM(r.nombre_cliente), ""), NULLIF(TRIM(c.razon_social), ""), NULLIF(TRIM(CONCAT(COALESCE(c.nombres, ""), " ", COALESCE(c.apellidos, ""))), ""), "-") AS cliente_nombre',
      ])
      .orderBy('r.fec_emision', 'DESC')
      .addOrderBy('r.id_comprobante', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<EmployeeSalesRaw>();

    return [
      rows.map((row) => ({
        ...row,
        numero: Number(row.numero),
        total: Number(row.total),
      })),
      total,
    ];
  }

  async findAllSaleTypes(): Promise<SalesType[]> {
    const rows = await this.salesTypeOrmRepository.find({
      order: { id_tipo_venta: 'ASC' },
    });
    return rows.map((r) =>
      SalesType.create({
        id_tipo_venta: r.id_tipo_venta,
        tipo: SalesTypeEnum[r.tipo as keyof typeof SalesTypeEnum],
        descripcion: r.descripcion,
      }),
    );
  }

  async findAllReceiptTypes(): Promise<ReceiptType[]> {
    const rows = await this.receiptTypeOrmRepository.find({
      order: { id_tipo_comprobante: 'ASC' },
    });
    return rows
      .filter((r) => this.normalizarBit(r.estado))
      .map((r) =>
        ReceiptType.create({
          id_tipo_comprobante: r.id_tipo_comprobante,
          cod_sunat: r.cod_sunat,
          descripcion: r.descripcion,
          estado: true,
        }),
      );
  }

  private normalizarBit(valor: any): boolean {
    if (typeof valor === 'boolean') return valor;
    if (typeof valor === 'number') return valor === 1;
    if (Buffer.isBuffer(valor)) return valor[0] === 1;
    return false;
  }

  async findPromocionesActivas(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT
        p.id_promocion,
        p.concepto,
        p.tipo,
        p.valor,
        p.activo,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id_regla',        r.id_regla,
            'tipo_condicion',  r.tipo_condicion,
            'valor_condicion', r.valor_condicion
          )
        ) AS reglas
      FROM mkp_ventas.promocion p
      LEFT JOIN mkp_ventas.regla_promocion r ON r.id_promocion = p.id_promocion
      WHERE p.activo = 1
      GROUP BY p.id_promocion
    `);
  }

  async findPromocionById(id: number): Promise<any | null> {
    const rows = await this.dataSource.query(
      `SELECT
         p.id_promocion,
         p.concepto,
         p.tipo,
         p.valor,
         p.activo,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id_regla',        r.id_regla,
             'tipo_condicion',  r.tipo_condicion,
             'valor_condicion', r.valor_condicion
           )
         ) AS reglas
       FROM mkp_ventas.promocion p
       LEFT JOIN mkp_ventas.regla_promocion r
              ON r.id_promocion = p.id_promocion
       WHERE p.id_promocion = ?
         AND p.activo = 1
       GROUP BY p.id_promocion`,
      [id],
    );
    if (!rows?.[0]) return null;

    const row = rows[0];
    const reglas = Array.isArray(row.reglas)
      ? row.reglas.filter((r: any) => r.id_regla !== null)
      : [];

    return { ...row, reglas };
  }

  async saveDescuentoAplicado(
    idComprobante: number,
    idPromocion: number,
    monto: number,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO mkp_ventas.descuento_aplicado (id_promocion, id_comprobante, monto) VALUES (?, ?, ?)`,
      [idPromocion, idComprobante, monto],
    );
  }

  async findCantidadComprasCliente(idCliente: string): Promise<number> {
    const row = await this.receiptOrmRepository
      .createQueryBuilder('r')
      .select('COUNT(r.id_comprobante) AS total')
      .where('r.id_cliente = :idCliente', { idCliente })
      .andWhere('r.estado != :anulado', { anulado: 'ANULADO' })
      .getRawOne();
    return Number(row?.total ?? 0);
  }

  async findByCorrelative(correlative: string): Promise<SalesReceipt | null> {
    if (!correlative || !correlative.includes('-')) return null;

    const [serieInput, numeroInput] = correlative
      .trim()
      .toUpperCase()
      .split('-');
    const numeroStr = Number(numeroInput);

    if (!serieInput || isNaN(numeroStr)) return null;

    const entity = await this.receiptOrmRepository.findOne({
      where: {
        serie: serieInput,
        numero: numeroStr,
        estado: Not(ReceiptStatusOrm.ANULADO),
      },
      relations: [
        'cliente',
        'tipoComprobante',
        'tipoVenta',
        'moneda',
        'details',
      ],
    });

    if (!entity) return null;
    return SalesReceiptMapper.toDomain(entity);
  }
}
