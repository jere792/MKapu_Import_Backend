/* apps/sales/src/core/quote/application/service/quote-query.service.ts */
import { Injectable, Inject } from '@nestjs/common';
import { IQuoteQueryPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { QuoteResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';

@Injectable()
export class QuoteQueryService implements IQuoteQueryPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
  ) {}

  async getById(id: number): Promise<QuoteResponseDto | null> {
    const quote = await this.repository.findById(id);
    return quote ? QuoteMapper.toResponseDto(quote) : null;
  }

  async getByCustomer(id_cliente: string): Promise<QuoteResponseDto[]> {
    const quotes = await this.repository.findByCustomerId(id_cliente);
    return quotes.map(quote => QuoteMapper.toResponseDto(quote));
  }
}