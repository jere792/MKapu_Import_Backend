import { CreateQuoteDto } from '../../../application/dto/in/create-quote.dto';
import { ListEmployeeQuotesFilterDto } from '../../../application/dto/in/list-employee-quotes-filter.dto';
import { QuoteQueryFiltersDto } from '../../../application/dto/in/quote-query-filters.dto';
import { EmployeeQuotesListResponseDto } from '../../../application/dto/out/employee-quotes-list-response.dto';
import { QuotePagedResponseDto, QuoteResponseDto } from '../../../application/dto/out/quote-response.dto';

export interface IQuoteCommandPort {
  create(dto: CreateQuoteDto): Promise<QuoteResponseDto>;
  approve(id: number): Promise<QuoteResponseDto>;
  changeStatus(id: number, estado: string): Promise<QuoteResponseDto>;
  delete(id: number): Promise<void>;
}

export interface IQuoteQueryPort {
  getById(id: number): Promise<QuoteResponseDto | null>;
  getByCustomerDocument(valor_doc: string): Promise<QuoteResponseDto[]>;
  findAllPaged(filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto>;
  listEmployeeQuotes(
    filters: ListEmployeeQuotesFilterDto,
  ): Promise<EmployeeQuotesListResponseDto>;
}
