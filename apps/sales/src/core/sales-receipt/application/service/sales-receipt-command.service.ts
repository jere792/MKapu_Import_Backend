/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { ISalesReceiptCommandPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { IPaymentRepositoryPort } from '../../domain/ports/out/payment-repository-ports-out';
import { LogisticsStockProxy } from '../../infrastructure/adapters/out/TCP/logistics-stock.proxy';
import { IPromotionQueryPort } from '../../../promotion/domain/ports/in/promotion-ports-in';
import { PromotionDto } from '../../../promotion/application/dto/out';
import { RegisterSalesReceiptDto, AnnulSalesReceiptDto } from '../dto/in';
import {
  SalesReceiptDeletedResponseDto,
  SalesReceiptResponseDto,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';
import {
  SalesReceiptOrmEntity,
  ReceiptStatusOrm,
} from '../../infrastructure/entity/sales-receipt-orm.entity';
import { SedeTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-tcp.proxy';
import { ReceiptStatus } from '../../domain/entity/sales-receipt-domain-entity';
import { CommissionCommandService } from '../../../commission/application/service/commission-command.service';
import { EmpresaPortOut } from '../../domain/ports/out/empresa-port-out';
import { buildSalesReceiptPdf } from '../../utils/sales-receipt-pdf.util';
import { SalesReceiptQueryService } from './sales-receipt-query.service';

// ── Mismo util que usa AccountReceivableQueryService ─────────────────────────
import { getWhatsAppStatus, sendWhatsApp } from 'libs/whatsapp.util';

import * as nodemailer from 'nodemailer';

@Injectable()
export class SalesReceiptCommandService implements ISalesReceiptCommandPort {
  private readonly logger = new Logger(SalesReceiptCommandService.name);

  private readonly transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('IPaymentRepositoryPort')
    private readonly paymentRepository: IPaymentRepositoryPort,
    private readonly stockProxy: LogisticsStockProxy,
    private readonly sedeTcpProxy: SedeTcpProxy,
    @Inject('IPromotionQueryPort')
    private readonly promotionQueryPort: IPromotionQueryPort,
    private readonly commissionCommandService: CommissionCommandService,
    @Inject('EmpresaPortOut')
    private readonly empresaPort: EmpresaPortOut,
    private readonly queryService: SalesReceiptQueryService,
  ) {}

  // ── WhatsApp ───────────────────────────────────────────────────────

  async getWhatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
    return getWhatsAppStatus();
  }

  async enviarComprobantePorWhatsApp(
    id: number,
  ): Promise<{ message: string; sentTo: string }> {
    const pdfData = await this.queryService.buildPdfData(id);

    const telefono = pdfData.cliente.telefono?.trim();
    if (!telefono) {
      throw new BadRequestException(
        'El cliente no tiene teléfono registrado para enviar por WhatsApp',
      );
    }

    const empresaRaw = await this.empresaPort.getEmpresaActiva();
    const empresa    = SalesReceiptMapper.toEmpresaPdfData(empresaRaw);
    const pdfBuffer  = await buildSalesReceiptPdf(pdfData, empresa);

    const docRef   = `${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}`;
    const filename = `Comprobante_${docRef}.pdf`;
    const mensaje  = [
      `🧾 *Comprobante ${docRef} - MKapu Import*`,
      ``,
      `Estimado/a *${pdfData.cliente.nombre}*,`,
      `Adjuntamos su comprobante de pago:`,
      ``,
      `💰 *Total:* S/. ${pdfData.total.toFixed(2)}`,
      `📅 *Fecha:* ${new Date(pdfData.fec_emision).toLocaleDateString('es-PE')}`,
      `💳 *Método de pago:* ${pdfData.metodo_pago}`,
      ``,
      `Gracias por su compra 🛍️`,
    ].join('\n');

    await sendWhatsApp(telefono, mensaje, pdfBuffer, filename);

    this.logger.log(`✅ Comprobante ${docRef} enviado por WhatsApp a ${telefono}`);

    return {
      message: `Comprobante ${docRef} enviado por WhatsApp`,
      sentTo:  telefono,
    };
  }

  // ── Comandos ───────────────────────────────────────────────────────

  async registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    console.log('📥 DTO completo:', JSON.stringify(dto, null, 2));
    console.log('🏢 branchId:', dto.branchId, '| tipo:', typeof dto.branchId);
    console.log('📋 serie recibida:', dto.serie);

    const cajaActiva = await this.paymentRepository.findActiveCajaId(
      dto.branchId,
    );
    const idCaja = cajaActiva ?? String(dto.branchId);

    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) throw new NotFoundException(`Cliente no existe.`);

    let descuentoCalculado = 0;

    if (dto.promotionId) {
      const promo = await this.promotionQueryPort.getPromotionById(
        dto.promotionId,
      );
      if (!promo)
        throw new NotFoundException('Promoción no encontrada o inactiva');

      const cantidadCompras =
        await this.receiptRepository.findCantidadComprasCliente(dto.customerId);
      await this.validarReglas(dto, promo.reglas ?? [], cantidadCompras === 0);
      descuentoCalculado = this.calcularDescuentoPromocion(dto, promo);
      console.log(
        `🎁 Descuento calculado para promoción ${dto.promotionId}: S/ ${descuentoCalculado}`,
      );
    }

    const assignedSerie = this.getAssignedSerie(dto.receiptTypeId);
    console.log('📋 assignedSerie:', assignedSerie);

    const queryRunner = this.receiptRepository.getQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedReceiptDomain;

    try {
      const nextNumber = await this.receiptRepository.getNextNumberWithLock(
        assignedSerie,
        queryRunner,
      );
      console.log('🔢 nextNumber para serie', assignedSerie, ':', nextNumber);

      const receipt = SalesReceiptMapper.fromRegisterDto(
        { ...dto, serie: assignedSerie, descuento: descuentoCalculado },
        nextNumber,
      );
      console.log('🧾 receipt.id_sede_ref:', receipt.id_sede_ref);
      receipt.validate();

      const receiptOrm = SalesReceiptMapper.toOrm(receipt);
      console.log('🗃️ receiptOrm.id_sede_ref:', receiptOrm.id_sede_ref);

      receiptOrm.estado = dto.esCreditoPendiente
        ? ReceiptStatusOrm.PENDIENTE
        : ReceiptStatusOrm.EMITIDO;
      console.log('📋 estado asignado:', receiptOrm.estado);

      const savedOrm = await queryRunner.manager.save(
        SalesReceiptOrmEntity,
        receiptOrm,
      );
      console.log(
        '💾 savedOrm.id_sede_ref:',
        savedOrm.id_sede_ref,
        '| id:',
        savedOrm.id_comprobante,
      );

      const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

      if (!dto.esCreditoPendiente) {
        await this.paymentRepository.savePaymentInTransaction(
          {
            id_comprobante: savedOrm.id_comprobante,
            id_tipo_pago: dto.paymentMethodId,
            monto: savedOrm.total,
          },
          queryRunner,
        );
        await this.paymentRepository.registerCashMovementInTransaction(
          {
            idCaja,
            idTipoPago: dto.paymentMethodId,
            tipoMov: tipoMovimiento,
            concepto: `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'NC'}: ${receipt.getFullNumber()}`,
            monto: savedOrm.total,
          },
          queryRunner,
        );
      }

      if (dto.promotionId && descuentoCalculado > 0) {
        await queryRunner.manager.query(
          `INSERT INTO mkp_ventas.descuento_aplicado (id_promocion, id_comprobante, monto) VALUES (?, ?, ?)`,
          [dto.promotionId, savedOrm.id_comprobante, descuentoCalculado],
        );
        console.log(
          `🎁 Descuento aplicado: promoción ${dto.promotionId} → comprobante ${savedOrm.id_comprobante} → S/ ${descuentoCalculado}`,
        );
      }

      await queryRunner.commitTransaction();
      savedReceiptDomain = SalesReceiptMapper.toDomain(savedOrm);

      if (!dto.esCreditoPendiente && dto.receiptTypeId !== 3) {
        try {
          await this.commissionCommandService.generateFromReceipt({
            id_comprobante: savedOrm.id_comprobante,
            id_responsable_ref: String(dto.responsibleId ?? dto.branchId),
            total: Number(savedOrm.total),
            fec_emision: savedOrm.fec_emision ?? new Date(),
            items: dto.items.map((item) => ({
              productId: Number(item.productId),
              categoryId:
                item.categoriaId !== undefined
                  ? Number(item.categoriaId)
                  : undefined,
              productName:
                item.description ?? item.codigo ?? String(item.productId),
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              total: Number(item.total ?? item.quantity * item.unitPrice),
            })),
          });
          console.log(
            `💰 Comisión generada para comprobante ${savedOrm.id_comprobante}`,
          );
        } catch (commissionError) {
          console.error(
            `⚠️ Error al generar comisión para comprobante ${savedOrm.id_comprobante}:`,
            commissionError,
          );
        }
      }

      if (dto.receiptTypeId !== 3 && !dto.esCreditoPendiente) {
        const warehouseId = await this.sedeTcpProxy.getAlmacenBySede(
          dto.branchId,
        );
        if (!warehouseId) {
          await this.annulReceiptDueToStockFailure(savedOrm.id_comprobante);
          throw new BadRequestException(
            `No hay almacén configurado para la sede ${dto.branchId}`,
          );
        }
        console.log(`🏭 Sede ${dto.branchId} → Almacén ${warehouseId}`);

        for (const item of receipt.items) {
          try {
            await this.stockProxy.registerMovement({
              productId: Number(item.productId),
              warehouseId,
              headquartersId: Number(dto.branchId),
              quantityDelta: -item.quantity,
              reason: 'VENTA',
              refId: savedOrm.id_comprobante,
              serie: savedOrm.serie,
              numero: String(savedOrm.numero).padStart(8, '0'),
            });
          } catch (error) {
            await this.annulReceiptDueToStockFailure(savedOrm.id_comprobante);
            throw new BadRequestException(
              `Fallo de Inventario: ${error.message}`,
            );
          }
        }
      }
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    console.log(
      `sedeId: ${dto.branchId}, receiptId: ${savedReceiptDomain.id_comprobante} - Venta registrada exitosamente.`,
    );
    return SalesReceiptMapper.toResponseDto(savedReceiptDomain);
  }

  async emitReceipt(
    id: number,
    paymentTypeId?: number,
  ): Promise<SalesReceiptResponseDto> {
    const receipt = await this.receiptRepository.findById(id);
    if (!receipt)
      throw new NotFoundException(`Comprobante ${id} no encontrado`);
    if (receipt.estado !== ReceiptStatus.PENDIENTE)
      throw new BadRequestException(
        `El comprobante no está en estado PENDIENTE`,
      );

    const queryRunner = this.receiptRepository.getQueryRunner();
    const cajaActiva = await this.paymentRepository.findActiveCajaId(
      receipt.id_sede_ref,
    );
    const idCaja = cajaActiva ?? String(receipt.id_sede_ref);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.query(
        'UPDATE comprobante_venta SET estado = ? WHERE id_comprobante = ?',
        ['EMITIDO', id],
      );

      if (paymentTypeId) {
        await this.paymentRepository.savePaymentInTransaction(
          {
            id_comprobante: id,
            id_tipo_pago: paymentTypeId,
            monto: receipt.total,
          },
          queryRunner,
        );
        await this.paymentRepository.registerCashMovementInTransaction(
          {
            idCaja,
            idTipoPago: paymentTypeId,
            tipoMov: 'INGRESO',
            concepto: `VENTA (crédito saldado): ${receipt.serie}-${receipt.numero}`,
            monto: receipt.total,
          },
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    try {
      await this.commissionCommandService.generateFromReceipt({
        id_comprobante: id,
        id_responsable_ref: String(
          receipt.id_responsable_ref ?? receipt.id_sede_ref,
        ),
        total: Number(receipt.total),
        fec_emision: receipt.fec_emision ?? new Date(),
        items: receipt.items.map((item) => ({
          productId: Number(item.productId),
          categoryId: undefined,
          productName: String(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice ?? 0),
          total: Number(item.quantity) * Number(item.unitPrice ?? 0),
        })),
      });
    } catch (commissionError) {
      console.error(
        `⚠️ Error al generar comisión al emitir comprobante ${id}:`,
        commissionError,
      );
    }

    const warehouseId = await this.sedeTcpProxy.getAlmacenBySede(
      receipt.id_sede_ref,
    );
    if (!warehouseId) {
      await this.annulReceiptDueToStockFailure(id);
      throw new BadRequestException(
        `No hay almacén configurado para la sede ${receipt.id_sede_ref}`,
      );
    }

    for (const item of receipt.items) {
      try {
        await this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId,
          headquartersId: Number(receipt.id_sede_ref),
          quantityDelta: -item.quantity,
          reason: 'VENTA',
          refId: id,
          serie: receipt.serie,
          numero: String(receipt.numero).padStart(8, '0'),
        });
      } catch (error) {
        await this.annulReceiptDueToStockFailure(id);
        throw new BadRequestException(`Fallo de Inventario: ${error.message}`);
      }
    }

    const updated = await this.receiptRepository.findById(id);
    return SalesReceiptMapper.toResponseDto(updated!);
  }

  async annulReceipt(
    dto: AnnulSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(
      dto.receiptId,
    );
    if (!existingReceipt)
      throw new NotFoundException(`ID ${dto.receiptId} no encontrado.`);

    const annulledReceipt = existingReceipt.anular();
    const savedReceipt    = await this.receiptRepository.update(annulledReceipt);

    await this.receiptRepository.updateStatus(
      existingReceipt.id_comprobante,
      'RECHAZADO',
    );

    try {
      await this.commissionCommandService.annulByReceipt(
        existingReceipt.id_comprobante,
      );
    } catch (commissionError) {
      console.error(
        `⚠️ Error al anular comisión del comprobante ${existingReceipt.id_comprobante}:`,
        commissionError,
      );
    }

    const fueEmitido = existingReceipt.estado === ReceiptStatus.EMITIDO;

    if (fueEmitido && existingReceipt.id_tipo_comprobante !== 3) {
      const warehouseId = await this.sedeTcpProxy.getAlmacenBySede(
        existingReceipt.id_sede_ref,
      );
      for (const item of existingReceipt.items) {
        this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId,
          headquartersId: savedReceipt.id_sede_ref,
          quantityDelta: item.quantity,
          reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
          refId: existingReceipt.id_comprobante,
          serie: savedReceipt.serie,
          numero: String(savedReceipt.numero).padStart(8, '0'),
        });
      }
    }

    const updated = await this.receiptRepository.findById(
      existingReceipt.id_comprobante,
    );
    return SalesReceiptMapper.toResponseDto(updated!);
  }

  async updateDispatchStatus(
    id_venta: number,
    status: string,
  ): Promise<boolean> {
    try {
      const sale = await this.receiptRepository.findById(id_venta);
      if (!sale) {
        console.error(`[SalesCommandService] Venta ${id_venta} no encontrada.`);
        return false;
      }
      await this.receiptRepository.updateStatus(id_venta, status);
      return true;
    } catch (error) {
      console.error(`[SalesCommandService] Error al actualizar estado:`, error);
      return false;
    }
  }

  async deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(id);
    if (!existingReceipt)
      throw new NotFoundException(`ID ${id} no encontrado.`);
    await this.receiptRepository.delete(id);
    return {
      receiptId: id,
      message: 'Comprobante eliminado.',
      deletedAt: new Date(),
    };
  }

  async enviarComprobantePorEmail(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const pdfData    = await this.queryService.buildPdfData(id);
    const empresaRaw = await this.empresaPort.getEmpresaActiva();
    const empresa    = SalesReceiptMapper.toEmpresaPdfData(empresaRaw);

    if (!pdfData.cliente.email)
      throw new BadRequestException('El cliente no tiene email registrado');

    const pdfBuffer = await buildSalesReceiptPdf(pdfData, empresa);
    const docRef    = `${pdfData.serie}-${String(pdfData.numero).padStart(8, '0')}`;

    await this.sendReceiptEmail(
      pdfData.cliente.email,
      pdfData.cliente.nombre,
      docRef,
      pdfBuffer,
    );

    return {
      success: true,
      message: `Comprobante ${docRef} enviado a ${pdfData.cliente.email}`,
    };
  }

  private async sendReceiptEmail(
    toEmail: string,
    clientName: string,
    docRef: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.transporter.sendMail({
      from:    process.env.MAIL_FROM ?? 'MKapu Import <no-reply@mkapu.com>',
      to:      toEmail,
      subject: `Comprobante ${docRef} - MKapu Import`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1A1A1A; padding: 16px;">
          <p>Estimado/a <strong>${clientName}</strong>,</p>
          <p>Adjuntamos el comprobante <strong>${docRef}</strong> para su revisión.</p>
          <p>Ante cualquier consulta, no dude en contactarnos.</p>
          <br/>
          <p>Atentamente,<br/><strong>MKapu Import</strong></p>
        </div>
      `,
      attachments: [
        {
          filename:    `Comprobante_${docRef}.pdf`,
          content:     pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    this.logger.log(`✅ Email enviado a ${toEmail} — ${docRef}`);
  }

  // ── Helpers privados ───────────────────────────────────────────────

  private calcularDescuentoPromocion(
    dto: RegisterSalesReceiptDto,
    promo: PromotionDto,
  ): number {
    const reglasProducto  = promo.reglas.filter((r) => r?.tipoCondicion === 'PRODUCTO');
    const reglasCategoria = promo.reglas.filter((r) => r?.tipoCondicion === 'CATEGORIA');
    const tieneRestriccionItems = reglasProducto.length > 0 || reglasCategoria.length > 0;

    let baseDescuento: number;

    if (tieneRestriccionItems) {
      const itemsCalificados = dto.items.filter((item) => {
        const calificaPorProducto =
          reglasProducto.length === 0 ||
          reglasProducto.some(
            (r) =>
              item.codigo === r.valorCondicion ||
              item.productId === r.valorCondicion,
          );
        const calificaPorCategoria =
          reglasCategoria.length === 0 ||
          reglasCategoria.some(
            (r) => item.categoriaId?.toString() === r.valorCondicion,
          );
        return calificaPorProducto && calificaPorCategoria;
      });

      if (itemsCalificados.length === 0) return 0;

      baseDescuento = itemsCalificados.reduce((sum, item) => {
        const totalConIgv = item.total ?? item.quantity * item.unitPrice * 1.18;
        return sum + Number((totalConIgv / 1.18).toFixed(2));
      }, 0);

      console.log(
        `🔍 Ítems calificados: ${itemsCalificados.length}/${dto.items.length} | Base sin IGV: S/ ${baseDescuento}`,
      );
    } else {
      baseDescuento = Number((dto.total / 1.18).toFixed(2));
      console.log(`🔍 Sin restricción de ítems | Base total sin IGV: S/ ${baseDescuento}`);
    }

    let monto = 0;
    if (promo.tipo === 'PORCENTAJE') {
      monto = Number(((baseDescuento * Number(promo.valor)) / 100).toFixed(2));
    } else if (promo.tipo === 'MONTO_FIJO') {
      monto = Number(Math.min(Number(promo.valor), baseDescuento).toFixed(2));
    }

    return monto;
  }

  private async validarReglas(
    dto: RegisterSalesReceiptDto,
    reglas: { tipoCondicion: string; valorCondicion: string }[],
    esNuevo: boolean,
  ): Promise<void> {
    for (const regla of reglas.filter((r) => r?.tipoCondicion)) {
      switch (regla.tipoCondicion) {
        case 'MINIMO_COMPRA':
          if (dto.total < Number(regla.valorCondicion))
            throw new BadRequestException(
              `Monto mínimo para esta promoción: S/ ${regla.valorCondicion}`,
            );
          break;
        case 'CLIENTE_NUEVO':
          if (!esNuevo)
            throw new BadRequestException(
              'Esta promoción es válida solo para clientes nuevos',
            );
          break;
        case 'PRODUCTO': {
          const tieneProducto = dto.items.some(
            (i) =>
              i.codigo === regla.valorCondicion ||
              i.productId === regla.valorCondicion,
          );
          if (!tieneProducto)
            throw new BadRequestException(
              `La promoción requiere el producto: ${regla.valorCondicion}`,
            );
          break;
        }
        case 'CATEGORIA': {
          const tieneCategoria = dto.items.some(
            (i) => i.categoriaId?.toString() === regla.valorCondicion,
          );
          if (!tieneCategoria)
            throw new BadRequestException(
              `La promoción requiere productos de la categoría: ${regla.valorCondicion}`,
            );
          break;
        }
      }
    }
  }

  private async annulReceiptDueToStockFailure(receiptId: number): Promise<void> {
    const queryRunner = this.receiptRepository.getQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.query(
        'UPDATE comprobante_venta SET estado = ? WHERE id_comprobante = ?',
        ['ANULADO', receiptId],
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      console.error(`🚨 ERROR CRÍTICO: Fallo al compensar venta ${receiptId}`, err);
    } finally {
      await queryRunner.release();
    }
  }

  private getAssignedSerie(receiptTypeId: number): string {
    const seriesMap: Record<number, string> = {
      1: 'F001',
      2: 'B001',
      3: 'NC01',
    };
    return seriesMap[receiptTypeId] || 'T001';
  }
}