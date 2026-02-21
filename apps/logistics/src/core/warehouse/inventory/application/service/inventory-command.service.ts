/* apps/logistics/src/core/inventory/application/service/inventory-command.service.ts */

import { Inject, Injectable } from '@nestjs/common';
import {
  IInventoryMovementCommandPort,
  MovementRequest,
} from '../../domain/ports/in/inventory-movement-ports-in.';
import { CreateInventoryMovementDto } from '../dto/in/create-inventory-movement.dto';
import { IInventoryRepositoryPort } from '../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMapper } from '../mapper/inventory.mapper';

@Injectable()
export class InventoryCommandService implements IInventoryMovementCommandPort {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
  ) {}
  async getStockLevel(productId: number, warehouseId: number): Promise<number> {
    const stock = await this.repository.findStock(productId, warehouseId);

    if (!stock) return 0;

    const statusStr = String(stock.status || stock.status || '').toUpperCase();
    const isActive =
      statusStr === '1' || statusStr === 'AVAILABLE' || statusStr === 'ACTIVO';

    return isActive ? stock.quantity : 0;
  }
  async executeMovement(dto: CreateInventoryMovementDto): Promise<void> {
    const movement = InventoryMapper.toDomain(dto);
    await this.repository.saveMovement(movement);
  }
  async registerIncome(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({
        ...item,
        type: 'INGRESO',
      })),
    };
    await this.executeMovement(fullDto);
  }

  async registerExit(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({
        ...item,
        type: 'SALIDA',
      })),
    };
    await this.executeMovement(fullDto);
  }
}
