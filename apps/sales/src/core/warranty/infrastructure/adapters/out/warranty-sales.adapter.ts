/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { IWarrantySalesPort } from '../../../domain/ports/out/warranty-ports-out';
import { SalesReceiptCommandService } from 'apps/sales/src/core/sales-receipt/application/service/sales-receipt-command.service';
import { RegisterSalesReceiptDto } from 'apps/sales/src/core/sales-receipt/application/dto/in';

@Injectable()
export class WarrantySalesAdapter implements IWarrantySalesPort {
  private readonly logger = new Logger(WarrantySalesAdapter.name);
  constructor(private readonly salesService: SalesReceiptCommandService) {}
  async generateCreditNote(data: {
    originalReceiptId: number;
    customerId: number;
    amount: number;
    reason: string;
    items: any[];
    branchId: number;
  }): Promise<void> {
    try {
      const total = data.amount;
      const subtotal = total / 1.18;
      const igv = total - subtotal;

      const receiptDto: RegisterSalesReceiptDto = {
        customerId: String(data.customerId),
        branchId: data.branchId,

        receiptTypeId: 3,
        saleTypeId: 1,
        serie: '',
        operationType: '01',

        dueDate: new Date(),
        responsibleId: 'SISTEMA',

        subtotal: Number(subtotal.toFixed(2)),
        igv: Number(igv.toFixed(2)),
        isc: 0,
        total: Number(total.toFixed(2)),

        currencyCode: 'PEN',

        items: data.items.map((i) => ({
          productId: String(i.cod_prod),
          description: i.prod_nombre || 'Producto en Garantía',
          quantity: i.cantidad || 1,
          unitPrice: i.price || 0,
          total: (i.cantidad || 1) * (i.price || 0),
          igv: 0,
        })),

        paymentMethodId: 1,
      };

      await this.salesService.registerReceipt(receiptDto);

      this.logger.log(`Nota de Crédito generada por Garantía. Total: ${total}`);
    } catch (error) {
      this.logger.error(`Error generando Nota de Crédito: ${error.message}`);
      throw error;
    }
  }
}
