import { Repository } from 'typeorm';
import { InventoryMovementPortsOut } from '../../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMovementOrmEntity } from '../../../entity/inventory-movement-orm.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryMovement } from '../../../../domain/entity/inventory-movement.entity';
import { Injectable } from '@nestjs/common';
import { InventoryMovementMapper } from '../../../../application/mapper/inventory-movement-mapper';

@Injectable()
export class InventoryMovementRepository implements InventoryMovementPortsOut {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly repository: Repository<InventoryMovementOrmEntity>,
  ) {}
  async save(movement: InventoryMovement): Promise<InventoryMovement> {
    const ormEntity = InventoryMovementMapper.toOrm(movement);
    const savedEntity = await this.repository.save(ormEntity);
    return InventoryMovementMapper.toDomain(savedEntity);
  }
}
