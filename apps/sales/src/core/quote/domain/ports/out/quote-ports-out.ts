import { QuoteQueryFiltersDto } from '../../../application/dto/in/quote-query-filters.dto';
import { Quote } from '../../entity/quote-domain-entity';

export interface EmployeeQuoteRaw {
  id_cotizacion: number;
  fec_emision: Date;
  cliente_nombre: string;
  total: number;
  estado: string;
}

export interface IQuoteRepositoryPort {
  save(quote: Quote): Promise<Quote>;
  update(quote: Quote): Promise<Quote>;
  findById(id: number): Promise<Quote | null>;
  findByCustomerId(id_cliente: string): Promise<Quote[]>;
  findAllPaged(filters: QuoteQueryFiltersDto): Promise<{ data: Quote[]; total: number }>;
  findEmployeeQuotesPaginated(
    filters: {
      userId: number;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number,
  ): Promise<[EmployeeQuoteRaw[], number]>;
  delete(id: number): Promise<void>;
  autocomplete(
  q: string,
  tipo?: string,
  id_sede?: number,
): Promise<{ id_cotizacion: number; codigo: string; cliente_nombre: string; fec_emision: string; total: number }[]>;
}
