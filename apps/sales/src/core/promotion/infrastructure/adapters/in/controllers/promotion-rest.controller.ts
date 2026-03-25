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
  Query,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import {
  IPromotionCommandPort,
  IPromotionQueryPort,
} from '../../../../domain/ports/in/promotion-ports-in';
import {
  CreatePromotionDto,
  ListPromotionFilterDto,
  UpdatePromotionDto,
} from '../../../../application/dto/in';

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
  async list(@Query() query: ListPromotionFilterDto) {
    return await this.queryPort.listPromotions(query);
  }

  @Get('active')
  async listActive() {
    return await this.queryPort.getActivePromotions();
  }

  @Get(':id/resolved')
  async getDetailById(@Param('id', ParseIntPipe) id: number) {
    return await this.queryPort.getPromotionDetailById(id);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.queryPort.getPromotionById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return await this.commandPort.updatePromotion(id, dto);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { activo: boolean },
  ) {
    return await this.commandPort.changeStatus({
      idPromocion: id,
      activo: body.activo,
    });
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
      return null;
    }
  }

  @MessagePattern({ cmd: 'get_active_promotions' })
  async getActivePromotions() {
    return await this.queryPort.getActivePromotions();
  }
}
