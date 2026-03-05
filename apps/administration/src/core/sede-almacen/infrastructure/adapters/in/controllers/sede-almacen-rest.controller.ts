import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ISedeAlmacenCommandPort,
  ISedeAlmacenQueryPort,
} from '../../../../domain/ports/in/sede-almacen-ports-in';
import { AssignWarehouseToSedeDto } from '../../../../application/dto/in';
import {
  SedeAlmacenListResponseDto,
  SedeAlmacenResponseDto,
} from '../../../../application/dto/out';

@Controller('sede-almacen')
export class SedeAlmacenRestController {
  constructor(
    @Inject('ISedeAlmacenCommandPort')
    private readonly commandService: ISedeAlmacenCommandPort,
    @Inject('ISedeAlmacenQueryPort')
    private readonly queryService: ISedeAlmacenQueryPort,
  ) {}

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  async assignWarehouseToSede(
    @Body() dto: AssignWarehouseToSedeDto,
  ): Promise<SedeAlmacenResponseDto> {
    return this.commandService.assignWarehouseToSede(dto);
  }

  // ── NUEVO: reasigna a otra sede (o asigna si no tenía) ──────────────────────
  @Put(':id_almacen/sede')
  @HttpCode(HttpStatus.OK)
  async reassignWarehouse(
    @Param('id_almacen', ParseIntPipe) id_almacen: number,
    @Body() body: { id_sede: number },
  ): Promise<SedeAlmacenResponseDto> {
    return this.commandService.reassignWarehouseToSede({
      id_almacen,
      id_sede: body.id_sede,
    });
  }

  // ── NUEVO: desasigna el almacén de su sede ──────────────────────────────────
  @Delete(':id_almacen/sede')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignWarehouse(
    @Param('id_almacen', ParseIntPipe) id_almacen: number,
  ): Promise<void> {
    return this.commandService.unassignWarehouse(id_almacen);
  }

  @Get('sede/:id_sede')
  async listWarehousesBySede(
    @Param('id_sede', ParseIntPipe) id_sede: number,
  ): Promise<SedeAlmacenListResponseDto> {
    return this.queryService.listWarehousesBySede(id_sede);
  }

  @Get('almacen/:id_almacen')
  async getAssignmentByWarehouse(
    @Param('id_almacen', ParseIntPipe) id_almacen: number,
  ): Promise<SedeAlmacenResponseDto> {
    return this.queryService.getAssignmentByWarehouse(id_almacen);
  }
}
