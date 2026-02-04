import { Quote } from '../../entity/quote-domain-entity';

export interface IQuoteRepositoryPort {
  save(quote: Quote): Promise<Quote>;
  update(quote: Quote): Promise<Quote>;
  findById(id: number): Promise<Quote | null>;
  findByCustomerId(id_cliente: string): Promise<Quote[]>;
}