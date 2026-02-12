import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { InventoryCommandService } from '../../../../application/service/inventory-command.service';
import { CreateInventoryMovementDto } from '../../../../application/dto/in/create-inventory-movement.dto';

@Controller('movimiento_inventario')
@UseGuards(RoleGuard)
export class InventoryMovementRestController {
  constructor(private readonly commandService: InventoryCommandService) {}

  @Post('income')
  @Roles('Administrador')
  @HttpCode(HttpStatus.CREATED)
  async registerIncome(@Body() dto: CreateInventoryMovementDto) {
    await this.commandService.executeMovement(dto);

    return {
      message: 'Ingreso de mercadería registrado exitosamente',
      data: {
        reference: `${dto.refTable} #${dto.refId}`,
      },
    };
  }
}
