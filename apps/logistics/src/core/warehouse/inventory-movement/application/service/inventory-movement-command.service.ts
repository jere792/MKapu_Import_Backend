import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InventoryMovementPortsOut } from '../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMovementPortsIn } from '../../domain/ports/in/inventory-movement-ports-in.';
import {
  InventoryDetail,
  InventoryMovement,
  OriginType,
} from '../../domain/entity/inventory-movement.entity';
import { RegisterIncomeDto } from '../dto/in/register-income.dto';
import { StockService } from '../../../stock/application/service/stock.service';

@Injectable()
export class InventoryMovementCommandService implements InventoryMovementPortsIn {
  constructor(
    @Inject('InventoryMovementPortsOut')
    private readonly movementRepo: InventoryMovementPortsOut,
    private readonly stockService: StockService,
  ) {}
  async registerIncome(dto: RegisterIncomeDto): Promise<InventoryMovement> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'El ingreso debe contener al menos un producto.',
      );
    }

    const details: InventoryDetail[] = [];

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `La cantidad para el producto ID ${item.productId} debe ser mayor a 0.`,
        );
      }

      details.push(
        new InventoryDetail(
          item.productId,
          item.warehouseId,
          item.quantity,
          'INGRESO',
        ),
      );
      await this.stockService.updateStock(
        item.productId,
        item.warehouseId,
        dto.headquartersId,
        item.quantity,
      );
    }

    let originType: OriginType = 'AJUSTE';
    if (dto.refTable === 'orden_compra') {
      originType = 'COMPRA';
    } else if (dto.refTable === 'transferencia') {
      originType = 'TRANSFERENCIA';
    } else if (dto.refTable === 'venta') {
      originType = 'VENTA';
    }

    const movement = new InventoryMovement({
      originType: originType,
      refId: dto.refId,
      refTable: dto.refTable,
      observation:
        dto.observation ||
        `Ingreso registrado desde ${dto.refTable} #${dto.refId}`,
      date: new Date(),
      items: details,
    });

    return await this.movementRepo.save(movement);
  }
}
