import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ListEmployeeQuotesFilterDto } from '../../../../application/dto/in/list-employee-quotes-filter.dto';
import { EmployeeQuotesListResponseDto } from '../../../../application/dto/out/employee-quotes-list-response.dto';
import { IQuoteQueryPort } from '../../../../domain/ports/in/quote-ports-in';

@Controller()
export class QuoteTcpController {
  constructor(
    @Inject('IQuoteQueryPort')
    private readonly quoteQueryService: IQuoteQueryPort,
  ) {}

  @MessagePattern({ cmd: 'find_quotes_by_employee' })
  findQuotesByEmployee(
    @Payload() filters: ListEmployeeQuotesFilterDto,
  ): Promise<EmployeeQuotesListResponseDto> {
    return this.quoteQueryService.listEmployeeQuotes(filters);
  }
}
