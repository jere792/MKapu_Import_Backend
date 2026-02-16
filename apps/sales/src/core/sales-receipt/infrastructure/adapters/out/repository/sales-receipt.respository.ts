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
        'cliente.tipoDocumento',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
        'payment',
        'payment.paymentType',
      ],
    });
    return receiptOrm ? SalesReceiptMapper.toDomain(receiptOrm) : null;
  }

  async findByIdWithRelations(
    id: number,
  ): Promise<SalesReceiptOrmEntity | null> {
    return await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details',
        'cliente',
        'cliente.tipoDocumento',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
        'payment',
        'payment.paymentType',
      ],
    });
  }

  async findByIdWithFullRelations(
    id: number,
  ): Promise<SalesReceiptOrmEntity | null> {
    return await this.receiptOrmRepository.findOne({
      where: { id_comprobante: id },
      relations: [
        'details',
        'cliente',
        'cliente.tipoDocumento',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
        'payment',
        'payment.paymentType',
      ],
    });
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
      relations: [
        'details',
        'cliente',
        'cliente.tipoDocumento',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
        'payment',
        'payment.paymentType',
      ],
      order: { numero: 'DESC' },
    });
    return receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r));
  }

  async findBySerieWithRelations(
    serie: string,
  ): Promise<SalesReceiptOrmEntity[]> {
    return await this.receiptOrmRepository.find({
      where: { serie },
      relations: [
        'details',
        'cliente',
        'cliente.tipoDocumento',
        'tipoVenta',
        'tipoComprobante',
        'moneda',
        'payment',
        'payment.paymentType',
      ],
      order: { numero: 'DESC' },
    });
  }

  async findAll(
    filters: FindAllPaginatedFilters,
  ): Promise<{ receipts: SalesReceipt[]; total: number }> {
    const query = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.details', 'details')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('cliente.tipoDocumento', 'tipoDocumento')
      .leftJoinAndSelect('receipt.tipoVenta', 'tipoVenta')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .leftJoinAndSelect('receipt.moneda', 'moneda')
      .leftJoinAndSelect('receipt.payment', 'payment')
      .leftJoinAndSelect('payment.paymentType', 'paymentType');

    if (filters.estado) {
      query.andWhere('receipt.estado = :estado', { estado: filters.estado });
    }

    if (filters.fec_desde) {
      query.andWhere('receipt.fec_emision >= :fec_desde', {
        fec_desde: filters.fec_desde,
      });
    }

    if (filters.fec_hasta) {
      const dateTo = new Date(filters.fec_hasta);
      dateTo.setHours(23, 59, 59, 999);
      query.andWhere('receipt.fec_emision <= :fec_hasta', {
        fec_hasta: dateTo,
      });
    }

    if (filters.id_cliente) {
      query.andWhere('cliente.id_cliente = :id_cliente', {
        id_cliente: filters.id_cliente,
      });
    }

    if (filters.id_tipo_comprobante) {
      query.andWhere(
        'tipoComprobante.id_tipo_comprobante = :id_tipo_comprobante',
        {
          id_tipo_comprobante: filters.id_tipo_comprobante,
        },
      );
    }

    if (filters.id_sede) {
      query.andWhere('receipt.id_sede_ref = :id_sede', {
        id_sede: filters.id_sede,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(receipt.serie LIKE :search OR receipt.numero LIKE :search OR cliente.nombres LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('receipt.fec_emision', 'DESC');
    query.distinct(true);
    query.skip(filters.skip);
    query.take(filters.take);

    const [receiptsOrm, total] = await query.getManyAndCount();

    return {
      receipts: receiptsOrm.map((r) => SalesReceiptMapper.toDomain(r)),
      total,
    };
  }

  async findAllWithRelations(
    filters: FindAllPaginatedFilters,
  ): Promise<{ receipts: SalesReceiptOrmEntity[]; total: number }> {
    const baseQuery = this.receiptOrmRepository.createQueryBuilder('receipt');

    if (filters.estado) {
      baseQuery.andWhere('receipt.estado = :estado', {
        estado: filters.estado,
      });
    }

    if (filters.fec_desde) {
      baseQuery.andWhere('receipt.fec_emision >= :fec_desde', {
        fec_desde: filters.fec_desde,
      });
    }

    if (filters.fec_hasta) {
      const dateTo = new Date(filters.fec_hasta);
      dateTo.setHours(23, 59, 59, 999);
      baseQuery.andWhere('receipt.fec_emision <= :fec_hasta', {
        fec_hasta: dateTo,
      });
    }

    if (filters.id_cliente) {
      baseQuery.andWhere('receipt.id_cliente = :id_cliente', {
        id_cliente: filters.id_cliente,
      });
    }

    if (filters.id_tipo_comprobante) {
      baseQuery.andWhere('receipt.id_tipo_comprobante = :id_tipo_comprobante', {
        id_tipo_comprobante: filters.id_tipo_comprobante,
      });
    }

    if (filters.id_sede) {
      baseQuery.andWhere('receipt.id_sede_ref = :id_sede', {
        id_sede: filters.id_sede,
      });
    }

    if (filters.search) {
      baseQuery.leftJoin('receipt.cliente', 'clienteSearch');
      baseQuery.andWhere(
        '(receipt.serie LIKE :search OR receipt.numero LIKE :search OR clienteSearch.nombres LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const total = await baseQuery.getCount();

    const query = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.details', 'details')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('cliente.tipoDocumento', 'tipoDocumento')
      .leftJoinAndSelect('receipt.tipoVenta', 'tipoVenta')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .leftJoinAndSelect('receipt.moneda', 'moneda')
      .leftJoinAndSelect('receipt.payment', 'payment')
      .leftJoinAndSelect('payment.paymentType', 'paymentType');

    if (filters.estado) {
      query.andWhere('receipt.estado = :estado', { estado: filters.estado });
    }

    if (filters.fec_desde) {
      query.andWhere('receipt.fec_emision >= :fec_desde', {
        fec_desde: filters.fec_desde,
      });
    }

    if (filters.fec_hasta) {
      const dateTo = new Date(filters.fec_hasta);
      dateTo.setHours(23, 59, 59, 999);
      query.andWhere('receipt.fec_emision <= :fec_hasta', {
        fec_hasta: dateTo,
      });
    }

    if (filters.id_cliente) {
      query.andWhere('cliente.id_cliente = :id_cliente', {
        id_cliente: filters.id_cliente,
      });
    }

    if (filters.id_tipo_comprobante) {
      query.andWhere(
        'tipoComprobante.id_tipo_comprobante = :id_tipo_comprobante',
        {
          id_tipo_comprobante: filters.id_tipo_comprobante,
        },
      );
    }

    if (filters.id_sede) {
      query.andWhere('receipt.id_sede_ref = :id_sede', {
        id_sede: filters.id_sede,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(receipt.serie LIKE :search OR receipt.numero LIKE :search OR cliente.nombres LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('receipt.fec_emision', 'DESC');
    query.skip(filters.skip);
    query.take(filters.take);

    const receiptsOrm = await query.getMany();

    return {
      receipts: receiptsOrm,
      total,
    };
  }

  async findCustomerPurchaseHistory(customerId: string): Promise<{
    customer: any;
    statistics: {
      totalCompras: number;
      totalEmitidos: number;
      totalAnulados: number;
      montoTotal: number;
      montoEmitido: number;
      promedioCompra: number;
    };
    recentPurchases: SalesReceiptOrmEntity[];
  }> {
    const customerReceipt = await this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('cliente.tipoDocumento', 'tipoDocumento')
      .where('cliente.id_cliente = :customerId', { customerId })
      .getOne();

    if (!customerReceipt || !customerReceipt.cliente) {
      return {
        customer: {
          id_cliente: customerId,
          nombres: 'Cliente no encontrado',
          tipo_doc: 'DNI',
          num_doc: '',
        },
        statistics: {
          totalCompras: 0,
          totalEmitidos: 0,
          totalAnulados: 0,
          montoTotal: 0,
          montoEmitido: 0,
          promedioCompra: 0,
        },
        recentPurchases: [],
      };
    }

    const statsQuery = this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoin('receipt.cliente', 'cliente')
      .select('COUNT(receipt.id_comprobante)', 'totalCompras')
      .addSelect(
        "SUM(CASE WHEN receipt.estado = 'EMITIDO' THEN 1 ELSE 0 END)",
        'totalEmitidos',
      )
      .addSelect(
        "SUM(CASE WHEN receipt.estado = 'ANULADO' THEN 1 ELSE 0 END)",
        'totalAnulados',
      )
      .addSelect('SUM(receipt.total)', 'montoTotal')
      .addSelect(
        "SUM(CASE WHEN receipt.estado = 'EMITIDO' THEN receipt.total ELSE 0 END)",
        'montoEmitido',
      )
      .where('cliente.id_cliente = :customerId', { customerId });

    const stats = await statsQuery.getRawOne();

    const totalEmitidos = Number(stats.totalEmitidos || 0);
    const montoEmitido = Number(stats.montoEmitido || 0);
    const promedioCompra = totalEmitidos > 0 ? montoEmitido / totalEmitidos : 0;

    const recentPurchases = await this.receiptOrmRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.cliente', 'cliente')
      .leftJoinAndSelect('receipt.tipoComprobante', 'tipoComprobante')
      .where('cliente.id_cliente = :customerId', { customerId })
      .orderBy('receipt.fec_emision', 'DESC')
      .take(10)
      .getMany();

    return {
      customer: customerReceipt.cliente,
      statistics: {
        totalCompras: Number(stats.totalCompras || 0),
        totalEmitidos: totalEmitidos,
        totalAnulados: Number(stats.totalAnulados || 0),
        montoTotal: Number(stats.montoTotal || 0),
        montoEmitido: montoEmitido,
        promedioCompra: promedioCompra,
      },
      recentPurchases,
    };
  }

  async getNextNumber(serie: string): Promise<number> {
    const lastReceipt = await this.receiptOrmRepository.findOne({
      where: { serie },
      order: { numero: 'DESC' },
    });
    return lastReceipt ? Number(lastReceipt.numero) + 1 : 1;
  }
}
