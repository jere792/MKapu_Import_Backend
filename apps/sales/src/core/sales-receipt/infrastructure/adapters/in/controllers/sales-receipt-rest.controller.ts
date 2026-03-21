/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
  SaleTypeResponseDto,
  ReceiptTypeResponseDto,
} from '../../../../application/dto/out';
import { PaymentTypeOrmEntity } from '../../../entity/payment-type-orm.entity';
import { SunatCurrencyOrmEntity } from '../../../entity/sunat-currency-orm.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  buildSalesReceiptPdf,
  SalesReceiptPdfData,
} from '../../../../utils/sales-receipt-pdf.util';
import { buildSalesReceiptThermalPdf } from '../../../../utils/sales-receipt-thermal.util';

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

  // ── Helpers compartidos ────────────────────────────────────────────

  /** Construye SalesReceiptPdfData a partir del id del comprobante */
  private async buildPdfData(id: number): Promise<SalesReceiptPdfData> {
    const detalle = await this.receiptQueryService.getDetalleCompleto(id, 1);
    if (!detalle)
      throw new NotFoundException(`Comprobante ${id} no encontrado`);

    let promoData: SalesReceiptPdfData['promocion'] = null;
    let codigosPromo: string[] = [];
    let porcentajePromo: number | null = null;

    if (detalle.promocion) {
      const reglas = detalle.promocion.reglas ?? [];

      const reglaProd = reglas.find((r: any) => {
        const tipoCond = (r as any).tipoCondicion ?? (r as any).tipo_condicion;
        return tipoCond === 'PRODUCTO';
      });

      const tipoPromo = detalle.promocion.tipo;
      const montoCabecera = Number(detalle.promocion.monto_descuento);

      const rawPromo: any = detalle.promocion;
      const posiblePorcentaje =
        rawPromo.valor ?? rawPromo.promo_valor ?? rawPromo.porcentaje ?? 0;

      porcentajePromo =
        tipoPromo?.toUpperCase() === 'PORCENTAJE'
          ? Number(posiblePorcentaje)
          : null;

      if (reglaProd) {
        const valorCond =
          (reglaProd as any).valorCondicion ??
          (reglaProd as any).valor_condicion;

        const productosAfectados = (detalle.productos ?? []).filter(
          (p: any) =>
            String(p.id_prod_ref) === String(valorCond) ||
            p.cod_prod === valorCond,
        );

        const listaAfectados = productosAfectados.map((p: any) => ({
          cod_prod: p.cod_prod,
          descripcion: p.descripcion,
          monto_descuento: montoCabecera,
        }));

        codigosPromo = listaAfectados.map((p) => p.cod_prod);

        promoData = {
          nombre:
            detalle.promocion.nombre ?? detalle.promocion.descuento_nombre,
          tipo: tipoPromo,
          monto_descuento: montoCabecera,
          productos_afectados: listaAfectados,
        };
      } else {
        promoData = {
          nombre:
            detalle.promocion.nombre ?? detalle.promocion.descuento_nombre,
          tipo: detalle.promocion.tipo,
          monto_descuento: montoCabecera,
          productos_afectados: [],
        };
      }
    }

    const productos = (detalle.productos ?? []).map((p: any) => {
      const estaEnPromo = codigosPromo.includes(p.cod_prod);
      return {
        cod_prod: p.cod_prod,
        descripcion: p.descripcion,
        cantidad: Number(p.cantidad),
        precio_unit: Number(p.pre_uni ?? p.precio_unit),
        total: Number(p.total),
        descuento_nombre:
          estaEnPromo && porcentajePromo != null ? `${porcentajePromo}%` : null,
        descuento_porcentaje:
          estaEnPromo && porcentajePromo != null ? porcentajePromo : null,
      };
    });

    return {
      id_comprobante: detalle.id_comprobante,
      serie: detalle.serie,
      numero: detalle.numero,
      tipo_comprobante: detalle.tipo_comprobante,
      fec_emision: detalle.fec_emision,
      fec_venc: detalle.fec_venc ?? null,
      estado: detalle.estado,
      subtotal: Number(detalle.subtotal),
      igv: Number(detalle.igv),
      total: Number(detalle.total),
      metodo_pago: detalle.metodo_pago ?? 'N/A',
      cliente: {
        nombre: detalle.cliente.nombre,
        documento: detalle.cliente.documento,
        tipo_documento: detalle.cliente.tipo_documento,
        direccion: detalle.cliente.direccion || undefined,
        email: detalle.cliente.email || undefined,
        telefono: detalle.cliente.telefono || undefined,
      },
      responsable: {
        nombre: detalle.responsable.nombre,
        nombreSede: detalle.responsable.nombreSede,
      },
      productos,
      promocion: promoData,
    };
  }

  // ── Comandos ───────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerReceipt(
    @Body() registerDto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    return this.receiptCommandService.registerReceipt(registerDto);
  }

  @Put(':id/emit')
  @HttpCode(HttpStatus.OK)
  async emitReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { paymentTypeId?: number },
  ): Promise<SalesReceiptResponseDto> {
    return this.receiptCommandService.emitReceipt(id, body.paymentTypeId);
  }

  @Put(':id/annul')
  @HttpCode(HttpStatus.OK)
  async annulReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
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

  // ── Consultas estáticas ────────────────────────────────────────────

  @Get('payment-types')
  async getPaymentTypes() {
    return this.paymentTypeRepo.find({ order: { id: 'ASC' } });
  }

  @Get('currencies')
  async getCurrencies() {
    return this.currencyRepo.find({ order: { codigo: 'ASC' } });
  }

  @Get('sale-types')
  @HttpCode(HttpStatus.OK)
  async getAllSaleTypes(): Promise<SaleTypeResponseDto[]> {
    return this.receiptQueryService.getAllSaleTypes();
  }

  @Get('receipt-types')
  @HttpCode(HttpStatus.OK)
  async getAllReceiptTypes(): Promise<ReceiptTypeResponseDto[]> {
    return this.receiptQueryService.getAllReceiptTypes();
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

  // ── PDFs ───────────────────────────────────────────────────────────

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

  @Get(':id/pdf')
  async downloadReceiptPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const pdfData = await this.buildPdfData(id);
    const buffer = await buildSalesReceiptPdf(pdfData);
    const filename = `comprobante-${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id/thermal')
  async downloadThermalVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Query('copia') copia: string,
    @Res() res: Response,
  ): Promise<void> {
    const esCopia = copia === 'true' || copia === '1';
    const pdfData = await this.buildPdfData(id);
    const buffer = await buildSalesReceiptThermalPdf(pdfData, esCopia);
    const filename = `ticket-${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  async getReceipt(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesReceiptResponseDto | null> {
    return this.receiptQueryService.getReceiptById(id);
  }

  // ── TCP ────────────────────────────────────────────────────────────
  @MessagePattern('get_sale_by_id')
  async getSaleByIdTcp(@Payload() id_comprobante: string | number) {
    const id = Number(id_comprobante);

    const sale = await this.receiptQueryService.getReceiptById(id);

    return sale;
  }

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
