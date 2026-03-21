import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IQuoteRepositoryPort } from '../../../../domain/ports/out/quote-ports-out';
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
    private readonly customerRepository: ICustomerRepositoryPort
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
      total:  quote.total,
    });
    return this.findById(quote.id_cotizacion!);
  }

  async findById(id: number): Promise<Quote | null> {
    const orm = await this.repository.findOne({ 
      where: { id_cotizacion: id },
      relations: ['customer', 'detalles']
    });
    return orm ? QuoteMapper.toDomain(orm) : null;
  }

  async findByCustomerId(id_cliente: string): Promise<Quote[]> {
    const orms = await this.repository.find({
      where: { id_cliente },
      order: { fec_emision: 'DESC' },
      relations: ['detalles']
    });
    return orms.map(orm => QuoteMapper.toDomain(orm));
  }

  async findByCustomerDocument(valor_doc: string): Promise<Quote[]> {
    const customer = await this.customerRepository.findByDocument(valor_doc);
    if (!customer) return [];
    return this.findByCustomerId(customer.id_cliente);
  }

  async findAllPaged(filters: QuoteQueryFiltersDto): Promise<{ data: any[]; total: number }> {
    const { estado, id_sede, search, page = 1, limit = 10 } = filters;
    const tipo = (filters as any).tipo;

    const pageNum   = Number(page)  || 1;
    const limitNum  = Number(limit) || 10;
    const idSedeNum = id_sede ? Number(id_sede) : undefined;

    let query = this.repository.createQueryBuilder('quote')
      .leftJoinAndSelect('quote.detalles', 'detalles');

    if (estado)    query = query.andWhere('quote.estado = :estado', { estado });
    if (idSedeNum) query = query.andWhere('quote.id_sede = :id_sede', { id_sede: idSedeNum });
    if (tipo)      query = query.andWhere('quote.tipo = :tipo', { tipo });
    if (search) {
      query = query.andWhere(
        `(CAST(quote.id_cotizacion AS CHAR) LIKE :search 
          OR LOWER(quote.id_cliente) LIKE :search 
          OR DATE_FORMAT(quote.fec_emision, '%Y-%m-%d') LIKE :search)`,
        { search: `%${search.toLowerCase()}%` }
      );
    }

    const [result, total] = await query
      .orderBy('quote.fec_emision', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    // ── Resolver nombres cross-schema ─────────────────────────────────────
    const idsProveedores = [
      ...new Set(result.filter(q => q.id_proveedor).map(q => Number(q.id_proveedor)))
    ];

    const proveedoresMap = new Map<number, string>();

    if (idsProveedores.length > 0) {
      const rows: { id_proveedor: number; razon_social: string }[] =
        await this.repository.manager.query(
          `SELECT id_proveedor, razon_social 
          FROM mkp_logistica.proveedor 
          WHERE id_proveedor IN (${idsProveedores.join(',')})`
        );
      rows.forEach(p => proveedoresMap.set(Number(p.id_proveedor), p.razon_social));
    }

    const dataConNombre = result.map(q => {
      const domain = QuoteMapper.toDomain(q);
      // Adjuntar proveedor_nombre directamente al objeto domain
      (domain as any).proveedor_nombre = q.id_proveedor
        ? proveedoresMap.get(Number(q.id_proveedor)) ?? null
        : null;
      return domain;
    });

    return { data: dataConNombre, total };
  }
  
  async delete(id: number): Promise<void> {
    await this.detailRepository.delete({ id_cotizacion: id });
    await this.repository.delete({ id_cotizacion: id });
  }
}