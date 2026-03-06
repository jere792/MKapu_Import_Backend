/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ISalesReceiptCommandPort,
  ISalesReceiptQueryPort,
} from '../../../../domain/ports/in/sales_receipt-ports-in';
import {
  RegisterSalesReceiptDto,
  AnnulSalesReceiptDto,
  ListSalesReceiptFilterDto,
} from '../../../../application/dto/in';
import {
  SalesReceiptResponseDto,
  SalesReceiptListResponse,
  SalesReceiptDeletedResponseDto,
} from '../../../../application/dto/out';
import { PaymentTypeOrmEntity } from '../../../entity/payment-type-orm.entity';
import { SunatCurrencyOrmEntity } from '../../../entity/sunat-currency-orm.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('receipts')
export class SalesReceiptRestController {
  constructor(
    @Inject('ISalesReceiptQueryPort')
    private readonly receiptQueryService: ISalesReceiptQueryPort,
    @Inject('ISalesReceiptCommandPort')
    private readonly receiptCommandService: ISalesReceiptCommandPort,

    @InjectRepository(PaymentTypeOrmEntity)
    private readonly paymentTypeRepo: Repository<PaymentTypeOrmEntity>,
    @InjectRepository(SunatCurrencyOrmEntity)
    private readonly currencyRepo: Repository<SunatCurrencyOrmEntity>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerReceipt(
    @Body() registerDto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    return this.receiptCommandService.registerReceipt(registerDto);
  }

  @Put(':id/annul')
  @HttpCode(HttpStatus.OK)
  async annulReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string, // Extrae la propiedad directamente
  ): Promise<SalesReceiptResponseDto> {
    if (!reason) throw new BadRequestException('El motivo es obligatorio');

    const annulDto: AnnulSalesReceiptDto = { receiptId: id, reason };
    return this.receiptCommandService.annulReceipt(annulDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptDeletedResponseDto> {
    return this.receiptCommandService.deleteReceipt(id);
  }

  // ── QUERIES ESTÁTICAS — SIN parámetros dinámicos — VAN PRIMERO ───────────

  @Get('payment-types')
  async getPaymentTypes() {
    return this.paymentTypeRepo.find({ order: { id: 'ASC' } });
  }

  @Get('currencies')
  async getCurrencies() {
    return this.currencyRepo.find({ order: { codigo: 'ASC' } });
  }

  @Get('kpi/semanal')
  async getKpiSemanal(@Query('sedeId') sedeId?: string) {
    return this.receiptQueryService.getKpiSemanal(
      sedeId ? Number(sedeId) : undefined,
    );
  }

  @Get('historial')
  async listHistorial(
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('receiptTypeId') receiptTypeId?: string,
    @Query('paymentMethodId') paymentMethodId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('sedeId') sedeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: ListSalesReceiptFilterDto = {
      status: status as any,
      customerId,
      receiptTypeId: receiptTypeId ? Number(receiptTypeId) : undefined,
      paymentMethodId: paymentMethodId ? Number(paymentMethodId) : undefined,
      dateFrom,
      dateTo,
      search,
      sedeId: sedeId ? Number(sedeId) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };
    return this.receiptQueryService.listReceiptsPaginated(filters);
  }

  @Get('serie/:serie')
  async getReceiptsBySerie(
    @Param('serie') serie: string,
  ): Promise<SalesReceiptListResponse> {
    return this.receiptQueryService.getReceiptsBySerie(serie);
  }

  @Get()
  async listReceipts(
    @Query() filters: ListSalesReceiptFilterDto,
  ): Promise<SalesReceiptListResponse> {
    return this.receiptQueryService.listReceipts(filters);
  }

  @Get(':id/detalle')
  async getDetalleCompleto(
    @Param('id', ParseIntPipe) id: number,
    @Query('historialPage') historialPage?: string,
  ) {
    const detalle = await this.receiptQueryService.getDetalleCompleto(
      id,
      historialPage ? Number(historialPage) : 1,
    );
    if (!detalle)
      throw new NotFoundException(`Comprobante ${id} no encontrado`);
    return detalle;
  }

  @Get(':id')
  async getReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptResponseDto | null> {
    return this.receiptQueryService.getReceiptById(id);
  }

  // ── TCP MESSAGE PATTERNS ──────────────────────────────────────────────────

  @MessagePattern({ cmd: 'verify_sale' })
  async verifySaleForRemission(@Payload() id_comprobante: number) {
    const sale =
      await this.receiptQueryService.verifySaleForRemission(id_comprobante);
    return sale
      ? { success: true, data: sale }
      : { success: false, message: 'Venta no encontrada' };
  }

  @MessagePattern({ cmd: 'update_dispatch_status' })
  async updateDispatchStatus(
    @Payload() data: { id_venta: number; status: string },
  ) {
    const success = await this.receiptCommandService.updateDispatchStatus(
      data.id_venta,
      data.status,
    );
    return { success };
  }

  @MessagePattern({ cmd: 'find_sale_by_correlativo' })
  async findSaleByCorrelativo(@Payload() correlativo: string) {
    return await this.receiptQueryService.findSaleByCorrelativo(correlativo);
  }
}
