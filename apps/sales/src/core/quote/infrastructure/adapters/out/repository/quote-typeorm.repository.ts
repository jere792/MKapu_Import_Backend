import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmployeeQuoteRaw,
  IQuoteRepositoryPort,
} from '../../../../domain/ports/out/quote-ports-out';
import { QuoteOrmEntity } from '../../../entity/quote-orm.entity';
import { QuoteDetailOrmEntity } from '../../../entity/quote-orm-detail.entity';
import { Quote } from '../../../../domain/entity/quote-domain-entity';
import { QuoteMapper } from '../../../../application/mapper/quote.mapper';
import { ICustomerRepositoryPort } from '../../../../../customer/domain/ports/out/customer-port-out';
import { QuoteQueryFiltersDto } from '../../../../application/dto/in/quote-query-filters.dto';

@Injectable()
export class QuoteTypeOrmRepository implements IQuoteRepositoryPort {
  constructor(
    @InjectRepository(QuoteOrmEntity)
    private readonly repository: Repository<QuoteOrmEntity>,
    @InjectRepository(QuoteDetailOrmEntity)
    private readonly detailRepository: Repository<QuoteDetailOrmEntity>,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
  ) {}

  async save(quote: Quote): Promise<Quote> {
    const ormEntity = QuoteMapper.toOrmEntity(quote);
    const saved = await this.repository.save(ormEntity);
    return QuoteMapper.toDomain(saved);
  }

  async update(quote: Quote): Promise<Quote> {
    await this.repository.update(quote.id_cotizacion!, {
      estado: quote.estado,
      activo: quote.activo,
      total: quote.total,
    });
    return this.findById(quote.id_cotizacion!);
  }

  async findById(id: number): Promise<Quote | null> {
    const orm = await this.repository.findOne({
      where: { id_cotizacion: id },
      relations: ['customer', 'detalles'],
    });
    return orm ? QuoteMapper.toDomain(orm) : null;
  }

  async findByCustomerId(id_cliente: string): Promise<Quote[]> {
    const orms = await this.repository.find({
      where: { id_cliente },
      order: { fec_emision: 'DESC' },
      relations: ['detalles'],
    });
    return orms.map((orm) => QuoteMapper.toDomain(orm));
  }

  async findAllPaged(
    filters: QuoteQueryFiltersDto,
  ): Promise<{ data: Quote[]; total: number }> {
    const { estado, id_sede, search, page = 1, limit = 10 } = filters;
    const tipo = (filters as any).tipo;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const idSedeNum = id_sede ? Number(id_sede) : undefined;

    let query = this.repository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.detalles', 'detalles');

    if (estado) query = query.andWhere('quote.estado = :estado', { estado });
    if (idSedeNum) {
      query = query.andWhere('quote.id_sede = :id_sede', { id_sede: idSedeNum });
    }
    if (tipo) query = query.andWhere('quote.tipo = :tipo', { tipo });
    if (search) {
      query = query
        .leftJoin('quote.customer', 'searchCustomer')  // join solo para el search
        .andWhere(
          `(
            quote.codigo LIKE :search
            OR CAST(quote.id_cotizacion AS CHAR) LIKE :search
            OR LOWER(quote.id_cliente) LIKE :search
            OR DATE_FORMAT(quote.fec_emision, '%Y-%m-%d') LIKE :search
            OR LOWER(searchCustomer.nombres) LIKE :search
            OR LOWER(searchCustomer.apellidos) LIKE :search
            OR LOWER(searchCustomer.razon_social) LIKE :search
          )`,
          { search: `%${search.toLowerCase()}%` },
        );
    }

    const [result, total] = await query
      .orderBy('quote.fec_emision', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    const idsProveedores = [
      ...new Set(result.filter((q) => q.id_proveedor).map((q) => Number(q.id_proveedor))),
    ];

    const proveedoresMap = new Map<number, string>();

    if (idsProveedores.length > 0) {
      const rows: { id_proveedor: number; razon_social: string }[] =
        await this.repository.manager.query(
          `SELECT id_proveedor, razon_social 
          FROM mkp_logistica.proveedor 
          WHERE id_proveedor IN (${idsProveedores.join(',')})`,
        );
      rows.forEach((p) => proveedoresMap.set(Number(p.id_proveedor), p.razon_social));
    }

    const dataConNombre = result.map((q) => {
      const domain = QuoteMapper.toDomain(q);
      (domain as any).proveedor_nombre = q.id_proveedor
        ? proveedoresMap.get(Number(q.id_proveedor)) ?? null
        : null;
      return domain;
    });

    return { data: dataConNombre, total };
  }

  async autocomplete(
    q: string,
    tipo?: string,
    id_sede?: number,
  ): Promise<{ id_cotizacion: number; codigo: string; cliente_nombre: string; fec_emision: string; total: number }[]> {
    const qb = this.repository
      .createQueryBuilder('quote')
      .leftJoin('quote.customer', 'cli')
      .select([
        'quote.id_cotizacion AS id_cotizacion',
        'quote.codigo        AS codigo',
        'quote.fec_emision   AS fec_emision',
        'quote.total         AS total',
        `COALESCE(
          NULLIF(TRIM(cli.razon_social), ''),
          NULLIF(TRIM(CONCAT(COALESCE(cli.nombres,''), ' ', COALESCE(cli.apellidos,''))), ''),
          '—'
        ) AS cliente_nombre`,
      ])
      .where('quote.activo = :activo', { activo: true })
      .andWhere(
        `(
          quote.codigo LIKE :q
          OR LOWER(cli.nombres)      LIKE :q
          OR LOWER(cli.apellidos)    LIKE :q
          OR LOWER(cli.razon_social) LIKE :q
        )`,
        { q: `%${q.toLowerCase()}%` },
      )
      .orderBy('quote.fec_emision', 'DESC')
      .limit(10);

    if (tipo)    qb.andWhere('quote.tipo = :tipo',       { tipo });
    if (id_sede) qb.andWhere('quote.id_sede = :id_sede', { id_sede });

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      id_cotizacion:  Number(r.id_cotizacion),
      codigo:         r.codigo,
      fec_emision:    r.fec_emision,
      total:          Number(r.total),
      cliente_nombre: r.cliente_nombre,
    }));
  }
  
  async findEmployeeQuotesPaginated(
    filters: {
      userId: number;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number,
  ): Promise<[EmployeeQuoteRaw[], number]> {
    const query = this.repository
      .createQueryBuilder('quote')
      .leftJoin('quote.customer', 'customer')
      .where('quote.tipo = :tipo', { tipo: 'VENTA' })
      .andWhere('quote.id_responsable_ref = :userId', {
        userId: String(filters.userId),
      });

    if (filters.dateFrom) {
      query.andWhere('quote.fec_emision >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters.dateTo) {
      query.andWhere('quote.fec_emision <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    const total = await query.getCount();
    const rows = await query
      .clone()
      .select([
        'quote.id_cotizacion AS id_cotizacion',
        'quote.fec_emision AS fec_emision',
        'quote.total AS total',
        'quote.estado AS estado',
        'COALESCE(NULLIF(TRIM(customer.razon_social), ""), NULLIF(TRIM(CONCAT(COALESCE(customer.nombres, ""), " ", COALESCE(customer.apellidos, ""))), ""), "-") AS cliente_nombre',
      ])
      .orderBy('quote.fec_emision', 'DESC')
      .addOrderBy('quote.id_cotizacion', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<EmployeeQuoteRaw>();

    return [
      rows.map((row) => ({
        ...row,
        id_cotizacion: Number(row.id_cotizacion),
        total: Number(row.total),
      })),
      total,
    ];
  }

  async delete(id: number): Promise<void> {
    await this.detailRepository.delete({ id_cotizacion: id });
    await this.repository.delete({ id_cotizacion: id });
  }
}
