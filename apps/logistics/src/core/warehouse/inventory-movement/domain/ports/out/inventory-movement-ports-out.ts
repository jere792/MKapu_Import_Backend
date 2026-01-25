import { InventoryMovement } from '../../entity/inventory-movement.entity';

export interface InventoryMovementPortsOut {
  save(movement: InventoryMovement): Promise<InventoryMovement>;
}
