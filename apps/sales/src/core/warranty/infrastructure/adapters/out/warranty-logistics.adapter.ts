/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IWarrantyLogisticsPort } from '../../../domain/ports/out/warranty-ports-out';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class WarrantyLogisticsAdapter implements IWarrantyLogisticsPort {
  private readonly logger = new Logger(WarrantyLogisticsAdapter.name);
  constructor(
    @Inject('LOGISTICS_SERVICE') private readonly client: ClientProxy,
  ) {}
  async registerProductEntry(data: {
    productId: string;
    productName: string;
    quantity: number;
    storeId: number;
    warrantyId: number;
  }): Promise<void> {
    try {
      const payload = {
        refId: data.warrantyId,
        refTable: 'GARANTIA',
        observation: `Ingreso por Garantía #${data.warrantyId} - ${data.productName}`,
        warehouseId: 1,
        headquartersId: data.storeId,
        items: [
          {
            productCode: data.productId,
            quantity: data.quantity,
            type: 'INGRESO',
          },
        ],
      };
      const pattern = { cmd: 'register_product_entry' };
      await lastValueFrom(this.client.send(pattern, payload));
      this.logger.log(
        `Registered product entry for warranty ID ${data.warrantyId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error notificando a logística: ${error.message}`,
        error.stack,
      );
    }
  }
}
