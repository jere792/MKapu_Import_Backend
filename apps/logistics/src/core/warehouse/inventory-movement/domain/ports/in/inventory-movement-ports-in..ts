import { RegisterIncomeDto } from '../../../application/dto/in/register-income.dto';
import { InventoryMovement } from '../../entity/inventory-movement.entity';

export interface InventoryMovementPortsIn {
  registerIncome(dto: RegisterIncomeDto): Promise<InventoryMovement>;
}
