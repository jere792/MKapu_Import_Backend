/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { ISalesReceiptCommandPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { IPaymentRepositoryPort } from '../../domain/ports/out/payment-repository-ports-out';

import { LogisticsStockProxy } from '../../infrastructure/adapters/out/TCP/logistics-stock.proxy';

import { RegisterSalesReceiptDto, AnnulSalesReceiptDto } from '../dto/in';
import {
  SalesReceiptDeletedResponseDto,
  SalesReceiptResponseDto,
} from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';
import { SalesReceiptItem } from '../../domain/entity/sales-receipt-domain-entity';

@Injectable()
export class SalesReceiptCommandService implements ISalesReceiptCommandPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    @Inject('IPaymentRepositoryPort')
    private readonly paymentRepository: IPaymentRepositoryPort,

    private readonly stockProxy: LogisticsStockProxy,
  ) {}
  async registerReceipt(
    dto: RegisterSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) throw new NotFoundException(`Cliente no existe.`);

    const assignedSerie = this.getAssignedSerie(dto.receiptTypeId);
    const nextNumber =
      await this.receiptRepository.getNextNumber(assignedSerie);

    const receipt = SalesReceiptMapper.fromRegisterDto(
      { ...dto, serie: assignedSerie },
      nextNumber,
    );
    receipt.validate();
    const processedItems: SalesReceiptItem[] = [];

    if (dto.receiptTypeId !== 3) {
      try {
        for (const item of receipt.items) {
          await this.stockProxy.registerMovement({
            productId: Number(item.productId),
            warehouseId: Number(dto.branchId),
            headquartersId: Number(dto.branchId),
            quantityDelta: -item.quantity, // Restamos stock
            reason: 'VENTA',
          });
          processedItems.push(item); // Agregamos a lista de "procesados" para rollback si falla luego
        }
      } catch (error) {
        // Si falla a la mitad, revertimos los items que SÍ pasaron
        const cleanMessage = error.message?.replace(/Error:/g, '').trim();
        await this.rollbackStock(processedItems, dto.branchId);
        throw new BadRequestException(
          `Stock insuficiente o error logístico: ${cleanMessage}`,
        );
      }
    }

    // --- PASO 3: Persistencia (Guardar Venta) ---
    let savedReceipt;
    try {
      savedReceipt = await this.receiptRepository.save(receipt);
    } catch (dbError) {
      await this.rollbackStock(processedItems, dto.branchId);
      throw new InternalServerErrorException(
        `Error guardando la venta en base de datos. Operación revertida ${dbError.message}.`,
      );
    }

    try {
      const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

      await this.paymentRepository.savePayment({
        idComprobante: savedReceipt.id_comprobante,
        idTipoPago: dto.paymentMethodId,
        monto: savedReceipt.total,
      });

      // B. Movimiento de Caja
      await this.paymentRepository.registerCashMovement({
        idCaja: String(dto.branchId), // Asumiendo que idCaja == idSede para este ejemplo, ajustar si hay lógica de cajas
        idTipoPago: dto.paymentMethodId,
        tipoMov: tipoMovimiento,
        concepto: `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'DEVOLUCION'}: ${savedReceipt.getFullNumber()}`,
        monto: savedReceipt.total,
      });
    } catch (paymentError) {
      console.error(
        '❌ Error crítico en caja. Iniciando compensación...',
        paymentError,
      );

      // ROLLBACK TOTAL:
      // 1. Devolver Stock
      await this.rollbackStock(processedItems, dto.branchId);
      // 2. Eliminar la boleta creada (Hard Delete o Soft Delete según política)
      await this.receiptRepository.delete(savedReceipt.id_comprobante);

      throw new BadRequestException(
        `Error registrando el pago en caja. La venta ha sido cancelada y revertida.`,
      );
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  /**
   * 2. ANULAR COMPROBANTE
   */
  async annulReceipt(
    dto: AnnulSalesReceiptDto,
  ): Promise<SalesReceiptResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(
      dto.receiptId,
    );
    if (!existingReceipt) {
      throw new NotFoundException(
        `Comprobante con ID ${dto.receiptId} no encontrado.`,
      );
    }

    // Lógica de Dominio
    const annulledReceipt = existingReceipt.anular();
    const savedReceipt = await this.receiptRepository.update(annulledReceipt);
    if (existingReceipt.id_tipo_comprobante !== 3) {
      for (const item of savedReceipt.items) {
        try {
          await this.stockProxy.registerMovement({
            productId: Number(item.productId),
            warehouseId: savedReceipt.id_sede_ref,
            headquartersId: savedReceipt.id_sede_ref,
            quantityDelta: item.quantity, // Positivo para reingresar
            reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
          });
        } catch (error) {
          console.error(
            `Error devolviendo stock para item ${item.productId} en anulación`,
            error,
          );
          // Aquí podríamos lanzar error o guardar en una tabla de "reintentos pendientes"
        }
      }
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }
  async deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(id);
    if (!existingReceipt) {
      throw new NotFoundException(`Comprobante con ID ${id} no encontrado.`);
    }

    await this.receiptRepository.delete(id);

    return {
      receiptId: id,
      message: 'Comprobante eliminado correctamente de la base de datos.',
      deletedAt: new Date(),
    };
  }
  private async rollbackStock(items: SalesReceiptItem[], branchId: number) {
    if (items.length === 0) return;
    console.log('🔄 Ejecutando Rollback de Stock...');

    for (const item of items) {
      try {
        await this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId: Number(branchId),
          headquartersId: Number(branchId),
          quantityDelta: item.quantity,
          reason: 'ROLLBACK_VENTA_FALLIDA',
        });
      } catch (err) {
        console.error(
          `❌ CRÍTICO: Falló el rollback para el producto ${item.productId}. Inconsistencia de stock posible.`,
          err,
        );
      }
    }
  }

  private getAssignedSerie(receiptTypeId: number): string {
    const seriesMap: Record<number, string> = {
      1: 'F001', // Factura
      2: 'B001', // Boleta
      3: 'NC01', // Nota de Crédito
    };
    return seriesMap[receiptTypeId] || 'T001';
  }
}
