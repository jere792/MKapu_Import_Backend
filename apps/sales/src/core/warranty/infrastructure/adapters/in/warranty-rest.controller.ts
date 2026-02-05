import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
import { RegisterWarrantyDto } from '../../../application/dto/in/register-warranty.dto';
import { WarrantyQueryService } from '../../../application/service/warranty-query.service';
import { WarrantyCommandService } from '../../../application/service/warranty-command.service';
import { ListWarrantyFilterDto } from '../../../application/dto/in/list-warranty-filter.dto';
import { UpdateWarrantyDto } from '../../../application/dto/in/update-warranty.dto';

@Controller('warranties')
@UseGuards(RoleGuard)
@Roles('GP_Garantias')
export class WarrantyRestController {
  constructor(
    private readonly commandService: WarrantyCommandService,
    private readonly queryService: WarrantyQueryService,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterWarrantyDto) {
    return await this.commandService.registerWarranty(dto);
  }
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWarrantyDto,
  ) {
    return this.commandService.updateWarranty(id, dto);
  }

  @Put(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { id_estado: number; comentario: string; id_usuario: string },
  ) {
    return this.commandService.changeStatus(
      id,
      body.id_estado,
      body.comentario,
      body.id_usuario,
    );
  }

  @Get()
  async list(@Query() filters: ListWarrantyFilterDto) {
    return this.queryService.listWarranties(filters);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.queryService.getWarrantyById(id);
  }

  @Get('receipt/:id_comprobante')
  async getByReceipt(
    @Param('id_comprobante', ParseIntPipe) idComprobante: number,
  ) {
    return this.queryService.getWarrantiesByReceipt(idComprobante);
  }
}
