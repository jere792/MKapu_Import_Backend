/* sales/src/core/sales-receipt/application/service/sales-receipt-command.service.ts */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISalesReceiptCommandPort } from '../../domain/ports/in/sales_receipt-ports-in';
import { ISalesReceiptRepositoryPort } from '../../domain/ports/out/sales_receipt-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { LogisticsStockProxy } from '../../infrastructure/adapters/out/TCP/logistics-stock.proxy';
import { IPaymentRepositoryPort } from '../../domain/ports/out/payment-repository-ports-out';

import { RegisterSalesReceiptDto, AnnulSalesReceiptDto } from '../dto/in';
import { SalesReceiptDeletedResponseDto } from '../dto/out';
import { SalesReceiptMapper } from '../mapper/sales-receipt.mapper';

@Injectable()
export class SalesReceiptCommandService implements ISalesReceiptCommandPort {
  constructor(
    @Inject('ISalesReceiptRepositoryPort')
    private readonly receiptRepository: ISalesReceiptRepositoryPort,

    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,

    @Inject('IPaymentRepositoryPort')
    private readonly paymentRepository: IPaymentRepositoryPort,

    // Usamos el Proxy en lugar del repositorio de otro microservicio
    private readonly stockProxy: LogisticsStockProxy,
  ) {}

  async registerReceipt(dto: RegisterSalesReceiptDto): Promise<any> {
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer)
      throw new NotFoundException(
        `El cliente con ID ${dto.customerId} no existe.`,
      );

    let assignedSerie = '';
    switch (dto.receiptTypeId) {
      case 1:
        assignedSerie = 'F001';
        break;
      case 2:
        assignedSerie = 'B001';
        break;
      case 3:
        assignedSerie = 'NC01';
        break;
      default:
        assignedSerie = 'T001';
        break;
    }

    const nextNumber =
      await this.receiptRepository.getNextNumber(assignedSerie);

    const receipt = SalesReceiptMapper.fromRegisterDto(
      { ...dto, serie: assignedSerie },
      nextNumber,
    );
    receipt.validate();

    const savedReceipt = await this.receiptRepository.save(receipt);

    const tipoMovimiento = dto.receiptTypeId === 3 ? 'EGRESO' : 'INGRESO';

    await this.paymentRepository.savePayment({
      idComprobante: savedReceipt.id_comprobante,
      idTipoPago: dto.paymentMethodId,
      monto: savedReceipt.total,
    });

    await this.paymentRepository.registerCashMovement({
      idCaja: String(dto.branchId),
      idTipoPago: dto.paymentMethodId,
      tipoMov: tipoMovimiento,
      concepto: `${tipoMovimiento === 'INGRESO' ? 'VENTA' : 'DEVOLUCION'}: ${savedReceipt.getFullNumber()}`,
      monto: savedReceipt.total,
    });

    if (dto.receiptTypeId !== 3) {
      for (const item of savedReceipt.items) {
        await this.stockProxy.registerMovement({
          productId: Number(item.productId),
          warehouseId: dto.branchId,
          headquartersId: dto.branchId,
          quantityDelta: -item.quantity,
          reason: `VENTA: ${savedReceipt.getFullNumber()}`,
        });
      }
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  async annulReceipt(dto: AnnulSalesReceiptDto): Promise<any> {
    const existingReceipt = await this.receiptRepository.findById(
      dto.receiptId,
    );
    if (!existingReceipt) {
      throw new NotFoundException(`Comprobante ${dto.receiptId} no encontrado`);
    }

    const annulledReceipt = existingReceipt.anular();
    const savedReceipt = await this.receiptRepository.update(annulledReceipt);

    for (const item of savedReceipt.items) {
      await this.stockProxy.registerMovement({
        productId: Number(item.productId),
        warehouseId: savedReceipt.id_sede_ref,
        headquartersId: savedReceipt.id_sede_ref,
        quantityDelta: item.quantity, // SUMAR por devolución
        reason: `ANULACION: ${savedReceipt.getFullNumber()}`,
      });
    }

    return SalesReceiptMapper.toResponseDto(savedReceipt);
  }

  async deleteReceipt(id: number): Promise<SalesReceiptDeletedResponseDto> {
    const existingReceipt = await this.receiptRepository.findById(id);
    if (!existingReceipt) {
      throw new NotFoundException(`ID ${id} no encontrado`);
    }
    await this.receiptRepository.delete(id);
    return {
      receiptId: id,
      message: 'Eliminado correctamente',
      deletedAt: new Date(),
    };
  }
}
