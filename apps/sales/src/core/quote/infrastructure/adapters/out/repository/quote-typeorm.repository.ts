/* apps/sales/src/core/quote/infrastructure/adapters/out/quote-typeorm.repository.ts */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IQuoteRepositoryPort } from '../../../../domain/ports/out/quote-ports-out';
import { QuoteOrmEntity } from '../../../entity/quote-orm.entity';
import { Quote } from '../../../../domain/entity/quote-domain-entity';
import { QuoteMapper } from '../../../../application/mapper/quote.mapper';

@Injectable()
export class QuoteTypeOrmRepository implements IQuoteRepositoryPort {
  constructor(
    @InjectRepository(QuoteOrmEntity)
    private readonly repository: Repository<QuoteOrmEntity>,
  ) {}

  async save(quote: Quote): Promise<Quote> {
    const ormEntity = QuoteMapper.toOrmEntity(quote);
    const saved = await this.repository.save(ormEntity);
    return QuoteMapper.toDomain(saved);
  }

  async update(quote: Quote): Promise<Quote> {
    const ormEntity = QuoteMapper.toOrmEntity(quote);
    // Usamos el ID para actualizar los campos específicos
    await this.repository.update(quote.id_cotizacion!, {
      estado: quote.estado,
      activo: quote.activo,
      total: quote.total,
      // Añade aquí otros campos que necesites permitir actualizar
    });
    return quote;
  }

  async findById(id: number): Promise<Quote | null> {
    const orm = await this.repository.findOne({ 
        where: { id_cotizacion: id },
        relations: ['customer'] // Por si necesitas traer los datos del cliente
    });
    return orm ? QuoteMapper.toDomain(orm) : null;
  }

  async findByCustomerId(id_cliente: string): Promise<Quote[]> {
    const orms = await this.repository.find({
      where: { id_cliente },
      order: { fec_emision: 'DESC' }
    });
    return orms.map(orm => QuoteMapper.toDomain(orm));
  }
}