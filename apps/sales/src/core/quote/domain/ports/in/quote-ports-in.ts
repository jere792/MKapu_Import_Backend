import { CreateQuoteDto } from '../../../application/dto/in/create-quote.dto';
import { QuoteResponseDto } from '../../../application/dto/out/quote-response.dto';

export interface IQuoteCommandPort {
  create(dto: CreateQuoteDto): Promise<QuoteResponseDto>;
  approve(id: number): Promise<QuoteResponseDto>;
}

export interface IQuoteQueryPort {
  getById(id: number): Promise<QuoteResponseDto | null>;
  getByCustomer(id_cliente: string): Promise<QuoteResponseDto[]>;
}