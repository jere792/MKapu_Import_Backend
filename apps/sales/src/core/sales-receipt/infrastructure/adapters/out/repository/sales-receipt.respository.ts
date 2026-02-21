/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* ============================================
   apps/sales/src/core/sales-receipt/infrastructure/adapters/out/repository/sales-receipt.respository.ts
   ============================================ */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';

import {
  ISalesReceiptRepositoryPort,
  FindAllPaginatedFilters,
} from '../../../../domain/ports/out/sales_receipt-ports-out';
import { SalesReceipt } from '../../../../domain/entity/sales-receipt-domain-entity';
import { SalesReceiptOrmEntity } from '../../../entity/sales-receipt-orm.entity';
import { SalesReceiptMapper } from '../../../../application/mapper/sales-receipt.mapper';
import { SalesReceiptAutocompleteResponseDto } from '../../../../application/dto/out'; // ✅

@Injectable()
export class SalesReceiptRepository implements ISalesReceiptRepositoryPort {
  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptOrmRepository: Repository<SalesReceiptOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── UTILS ───────────────────────────────────────────────────────────────

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

  async getNextNumber(serie: string): Promise<number> {
    const last = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return last ? Number(last.numero) + 1 : 1;
  }

  // ─── WRITE ───────────────────────────────────────────────────────────────

  async save(receipt: SalesReceipt): Promise<SalesReceipt> {
    const orm    = SalesReceiptMapper.toOrm(receipt);
    const saved  = await this.receiptOrmRepository.save(orm);
    return this.findById(saved.id_comprobante) as Promise<SalesReceipt>;
  }

  async update(receipt: SalesReceipt): Promise<SalesReceipt> {
    const orm     = SalesReceiptMapper.toOrm(receipt);
    const updated = await this.receiptOrmRepository.save(orm);
    return SalesReceiptMapper.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.receiptOrmRepository.delete(id);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findById(id: number): Promise<SalesReceipt | null> {
    const orm = await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details', 'cliente', 'cliente.tipoDocumento',
        'tipoVenta', 'tipoComprobante', 'moneda',
        'payment', 'payment.paymentType',
      ],
    });
    return orm ? SalesReceiptMapper.toDomain(orm) : null;
  }

  async findByIdWithRelations(id: number): Promise<SalesReceiptOrmEntity | null> {
    return this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details', 'cliente', 'cliente.tipoDocumento',
        'tipoVenta', 'tipoComprobante', 'moneda',
        'payment', 'payment.paymentType',
      ],
    });
  }

  async findByIdWithFullRelations(id: number): Promise<SalesReceiptOrmEntity | null> {
    return this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details', 'cliente', 'cliente.tipoDocumento',
        'tipoVenta', 'tipoComprobante', 'moneda',
        'payment', 'payment.paymentType',
      ],
    });
  }

  async findBySerie(serie: string): Promise<SalesReceipt[]> {
    const orms = await this.receiptOrmRepository.find({
      where: { serie },
      relations: [
        'details', 'cliente', 'cliente.tipoDocumento',
        'tipoVenta', 'tipoComprobante', 'moneda',
        'payment', 'payment.paymentType',
      ],
      order: { numero: 'DESC' },
    });
    return orms.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async findBySerieWithRelations(serie: string): Promise<SalesReceiptOrmEntity[]> {
    return this.receiptOrmRepository.find({
      where: { serie },
      relations: [
        'details', 'cliente', 'cliente.tipoDocumento',
        'tipoVenta', 'tipoComprobante', 'moneda',
        'payment', 'payment.paymentType',
      ],
      order: { numero: 'DESC' },
    });
  }

  // ─── FIND ALL PAGINADO (usado por el servicio) ─────────────────────────

  async findAllWithRelations(
    filters: FindAllPaginatedFilters,
  ): Promise<{ receipts: SalesReceiptOrmEntity[]; total: number }> {

    // ── Query de conteo (sin relaciones para ser más rápido) ──
    const countQuery = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      // ✅ Solo registros con número válido
      .where('receipt.numero > 0');

    if (filters.id_sede) {
      countQuery.andWhere('receipt.id_sede_ref = :id_sede', { id_sede: filters.id_sede });
    }
    if (filters.estado) {
      countQuery.andWhere('receipt.estado = :estado', { estado: filters.estado });
    }
    if (filters.fec_desde) {
      countQuery.andWhere('receipt.fec_emision >= :fec_desde', { fec_desde: filters.fec_desde });
    }
    if (filters.fec_hasta) {
      const dateTo = new Date(filters.fec_hasta);
      dateTo.setHours(23, 59, 59, 999);
      countQuery.andWhere('receipt.fec_emision <= :fec_hasta', { fec_hasta: dateTo });
    }
    if (filters.id_cliente) {
      countQuery.andWhere('receipt.id_cliente = :id_cliente', { id_cliente: filters.id_cliente });
    }
    if (filters.id_tipo_comprobante) {
      countQuery.andWhere('receipt.id_tipo_comprobante = :id_tipo_comprobante', {
        id_tipo_comprobante: filters.id_tipo_comprobante,
      });
    }
    if (filters.search) {
      countQuery
        .leftJoin('receipt.cliente', 'clienteCount')
        .andWhere(
          `(receipt.serie LIKE :search
           OR CAST(receipt.numero AS CHAR) LIKE :search
           OR clienteCount.valor_doc    LIKE :search
           OR clienteCount.nombres      LIKE :search
           OR clienteCount.apellidos    LIKE :search
           OR clienteCount.razon_social LIKE :search)`,
          { search: `%${filters.search}%` },
        );
    }

    const total = await countQuery.getCount();

    // ── Query principal con relaciones ──
    const query = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.details',          'details')
      .leftJoinAndSelect('receipt.cliente',          'cliente')
      .leftJoinAndSelect('cliente.tipoDocumento',    'tipoDocumento')
      .leftJoinAndSelect('receipt.tipoVenta',        'tipoVenta')
      .leftJoinAndSelect('receipt.tipoComprobante',  'tipoComprobante')
      .leftJoinAndSelect('receipt.moneda',           'moneda')
      .leftJoinAndSelect('receipt.payment',          'payment')
      .leftJoinAndSelect('payment.paymentType',      'paymentType')
      // ✅ Solo registros con número válido
      .where('receipt.numero > 0');

    if (filters.id_sede) {
      query.andWhere('receipt.id_sede_ref = :id_sede', { id_sede: filters.id_sede });
    }
    if (filters.estado) {
      query.andWhere('receipt.estado = :estado', { estado: filters.estado });
    }
    if (filters.fec_desde) {
      query.andWhere('receipt.fec_emision >= :fec_desde', { fec_desde: filters.fec_desde });
    }
    if (filters.fec_hasta) {
      const dateTo = new Date(filters.fec_hasta);
      dateTo.setHours(23, 59, 59, 999);
      query.andWhere('receipt.fec_emision <= :fec_hasta', { fec_hasta: dateTo });
    }
    if (filters.id_cliente) {
      query.andWhere('cliente.id_cliente = :id_cliente', { id_cliente: filters.id_cliente });
    }
    if (filters.id_tipo_comprobante) {
      query.andWhere('tipoComprobante.id_tipo_comprobante = :id_tipo_comprobante', {
        id_tipo_comprobante: filters.id_tipo_comprobante,
      });
    }
    if (filters.search) {
      query.andWhere(
        `(receipt.serie LIKE :search
         OR CAST(receipt.numero AS CHAR) LIKE :search
         OR cliente.valor_doc    LIKE :search
         OR cliente.nombres      LIKE :search
         OR cliente.apellidos    LIKE :search
         OR cliente.razon_social LIKE :search)`,
        { search: `%${filters.search}%` },
      );
    }

    const receiptsOrm = await query
      .orderBy('receipt.fec_emision', 'DESC')
      .skip(filters.skip)
      .take(filters.take)
      .getMany();

    return { receipts: receiptsOrm, total };
  }

  // ─── HISTORIAL DE CLIENTE ─────────────────────────────────────────────

  async findCustomerPurchaseHistory(customerId: string): Promise<{
    customer: any;
    statistics: {
      totalCompras:  number;
      totalEmitidos: number;
      totalAnulados: number;
      montoTotal:    number;
      montoEmitido:  number;
      promedioCompra: number;
    };
    recentPurchases: SalesReceiptOrmEntity[];
  }> {
    const customerReceipt = await this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.cliente',          'cliente')
      .leftJoinAndSelect('cliente.tipoDocumento',    'tipoDocumento')
      .where('cliente.id_cliente = :customerId', { customerId })
      .getOne();

    if (!customerReceipt?.cliente) {
      return {
        customer: {
          id_cliente: customerId,
          nombres:    'Cliente no encontrado',
          tipo_doc:   'DNI',
          num_doc:    '',
        },
        statistics: {
          totalCompras: 0, totalEmitidos: 0, totalAnulados: 0,
          montoTotal: 0, montoEmitido: 0, promedioCompra: 0,
        },
        recentPurchases: [],
      };
    }

    const stats = await this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoin('receipt.cliente', 'cliente')
      .select([
        'COUNT(receipt.id_comprobante)                                              AS totalCompras',
        "SUM(CASE WHEN receipt.estado = 'EMITIDO' THEN 1 ELSE 0 END)               AS totalEmitidos",
        "SUM(CASE WHEN receipt.estado = 'ANULADO' THEN 1 ELSE 0 END)               AS totalAnulados",
        'SUM(receipt.total)                                                         AS montoTotal',
        "SUM(CASE WHEN receipt.estado = 'EMITIDO' THEN receipt.total ELSE 0 END)   AS montoEmitido",
      ])
      .where('cliente.id_cliente = :customerId', { customerId })
      .getRawOne();

    const totalEmitidos = Number(stats.totalEmitidos || 0);
    const montoEmitido  = Number(stats.montoEmitido  || 0);

    const recentPurchases = await this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.cliente',         'cliente')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .where('cliente.id_cliente = :customerId', { customerId })
      .orderBy('receipt.fec_emision', 'DESC')
      .take(10)
      .getMany();

    return {
      customer: customerReceipt.cliente,
      statistics: {
        totalCompras:  Number(stats.totalCompras  || 0),
        totalEmitidos,
        totalAnulados: Number(stats.totalAnulados || 0),
        montoTotal:    Number(stats.montoTotal    || 0),
        montoEmitido,
        promedioCompra: totalEmitidos > 0 ? montoEmitido / totalEmitidos : 0,
      },
      recentPurchases,
    };
  }

  // ─── AUTOCOMPLETE ─────────────────────────────────────────────────────

  async autocompleteCustomers(
    search: string,
    sedeId?: number,
  ): Promise<SalesReceiptAutocompleteResponseDto[]> {
    const query = this.receiptOrmRepository  // ✅ FIXED: era this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoin('receipt.cliente',         'cliente')
      .leftJoin('receipt.tipoComprobante', 'tipoComprobante')
      .select([
        'cliente.id_cliente                    AS clienteId',
        'cliente.valor_doc                     AS documento',
        'cliente.nombres                       AS nombres',
        'cliente.apellidos                     AS apellidos',
        'cliente.razon_social                  AS razonSocial',
        'tipoComprobante.descripcion           AS tipoComprobante',
        'MAX(receipt.fec_emision)              AS ultimaCompra',
        'COUNT(receipt.id_comprobante)         AS totalCompras',
      ])
      .where('receipt.numero > 0')
      .andWhere(
        `(cliente.valor_doc    LIKE :search
         OR cliente.nombres    LIKE :search
         OR cliente.apellidos  LIKE :search
         OR cliente.razon_social LIKE :search)`,
        { search: `%${search}%` },
      );

    if (sedeId) {
      query.andWhere('receipt.id_sede_ref = :sedeId', { sedeId });
    }

    return query
      .groupBy('cliente.id_cliente, tipoComprobante.descripcion')
      .orderBy('ultimaCompra', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
