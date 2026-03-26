import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Inject,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  IQuoteCommandPort,
  IQuoteQueryPort,
} from '../../../../domain/ports/in/quote-ports-in';
import { CreateQuoteDto } from '../../../../application/dto/in/create-quote.dto';
import {
  QuoteResponseDto,
  QuotePagedResponseDto,
} from '../../../../application/dto/out/quote-response.dto';
import { QuoteQueryFiltersDto } from '../../../../application/dto/in/quote-query-filters.dto';
import { QuoteQueryService } from '../../../../application/service/quote-query.service';
@Controller('quote')
export class QuoteController {
  constructor(
    @Inject('IQuoteCommandPort')
    private readonly commandPort: IQuoteCommandPort,
    @Inject('IQuoteQueryPort')
    private readonly queryPort: IQuoteQueryPort,
    private readonly quoteQueryService: QuoteQueryService,
  ) {}

  // --- Comandos (Escritura) ---

  @Post()
  async create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return await this.commandPort.create(dto);
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number): Promise<QuoteResponseDto> {
    return await this.commandPort.approve(id);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string },
  ): Promise<QuoteResponseDto> {
    return await this.commandPort.changeStatus(id, body.estado);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.commandPort.delete(id);
  }

  // --- Consultas (Lectura) ---

  @Get()
  async listQuotes(@Query() filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto> {
    return this.queryPort.findAllPaged(filters);
  }

  @Get('autocomplete/search')
  async autocomplete(
    @Query('q') q: string,
    @Query('tipo') tipo?: string,
    @Query('id_sede') id_sede?: string,
  ) {
    return this.quoteQueryService.autocomplete(
      q ?? '',
      tipo,
      id_sede ? Number(id_sede) : undefined,
    );
  }

  @Get('customer/:valor_doc')
  async getByCustomer(@Param('valor_doc') valor_doc: string): Promise<QuoteResponseDto[]> {
    return await this.queryPort.getByCustomerDocument(valor_doc);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<QuoteResponseDto | null> {
    return await this.queryPort.getById(id);
  }

  // --- Exportaciones y Mensajería ---

  @Get(':id/export/pdf')
  async exportPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return await this.quoteQueryService.exportPdf(id, res);
  }

  @Get(':id/export/thermal')
  async exportThermalVoucher(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    return await this.quoteQueryService.exportThermalVoucher(id, res);
  }

  @Post(':id/send-email')
  async sendByEmail(@Param('id', ParseIntPipe) id: number) {
    return await this.quoteQueryService.sendByEmail(id);
  }

  @Get('whatsapp/status')
  async whatsAppStatus() {
    return this.quoteQueryService.whatsAppStatus();
  }

  @Post(':id/send-whatsapp')
  async sendByWhatsApp(@Param('id', ParseIntPipe) id: number) {
    return await this.quoteQueryService.sendByWhatsApp(id);
  }
}