import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Inject,
  ParseIntPipe,
  Get,
  Query
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import {
  IPromotionCommandPort,
  IPromotionQueryPort
} from '../../../../domain/ports/in/promotion-ports-in';
import { CreatePromotionDto, UpdatePromotionDto, ChangePromotionStatusDto } from '../../../../application/dto/in';

@Controller('promotions')
export class PromotionRestController {
  constructor(
    @Inject('IPromotionCommandPort')
    private readonly commandPort: IPromotionCommandPort,
    @Inject('IPromotionQueryPort')
    private readonly queryPort: IPromotionQueryPort,
  ) {}

  @Post()
  async register(@Body() dto: CreatePromotionDto) {
    return await this.commandPort.registerPromotion(dto);
  }

  @Get()
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    return await this.queryPort.listPromotions(Number(page), Number(limit));
  }

  @Get('active')
  async listActive() {
    return await this.queryPort.getActivePromotions();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.queryPort.getPromotionById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto
  ) {
    return await this.commandPort.updatePromotion(id, dto);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { activo: boolean }
  ) {
    return await this.commandPort.changeStatus({ idPromocion: id, activo: body.activo });
  }

  @Delete(':id/hard')
  async hardDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.commandPort.hardDeletePromotion(id);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.commandPort.deletePromotion(id);
  }

    @MessagePattern({ cmd: 'get_promotion_by_id' })
  async getPromotionById(@Payload() payload: { id: number }) {
    try {
      return await this.queryPort.getPromotionById(payload.id);
    } catch {
      // Si no existe, devolver null en lugar de lanzar excepción TCP
      return null;
    }
  }

  /**
   * Retorna todas las promociones activas.
   * Usado por el frontend de ventas para el selector de promociones.
   */
  @MessagePattern({ cmd: 'get_active_promotions' })
  async getActivePromotions() {
    return await this.queryPort.getActivePromotions();
  }
}