import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Patch, 
  Inject, 
  ParseIntPipe 
} from '@nestjs/common';
import { IQuoteCommandPort, IQuoteQueryPort } from '../../../../domain/ports/in/quote-ports-in';
import { CreateQuoteDto } from '../../../../application/dto/in/create-quote.dto';
import { QuoteResponseDto } from '../../../../application/dto/out/quote-response.dto';

@Controller('quote')
export class QuoteController {
  constructor(
    @Inject('IQuoteCommandPort')
    private readonly commandPort: IQuoteCommandPort,
    @Inject('IQuoteQueryPort')
    private readonly queryPort: IQuoteQueryPort,
  ) {}

  @Post()
  async create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return await this.commandPort.create(dto);
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number): Promise<QuoteResponseDto> {
    return await this.commandPort.approve(id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<QuoteResponseDto | null> {
    return await this.queryPort.getById(id);
  }

  @Get('customer/:id_cliente')
  async getByCustomer(@Param('id_cliente') id_cliente: string): Promise<QuoteResponseDto[]> {
    return await this.queryPort.getByCustomer(id_cliente);
  }
}