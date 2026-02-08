import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommissionCommandService } from '../../../../application/service/commission-command.service';
import { CommissionQueryService } from '../../../../application/service/commission-query.service';
import { CreateCommissionRuleDto } from '../../../../application/dto/in/create-commission-rule.dto';
import { CommissionTargetType } from '../../../../domain/entity/commission-rule.entity';

@Controller('commissions')
export class CommissionController {
  constructor(
    private readonly commandService: CommissionCommandService,
    private readonly queryService: CommissionQueryService,
  ) {}
  @Post('rules/product')
  async createProductRule(@Body() dto: CreateCommissionRuleDto) {
    dto.tipo_objetivo = CommissionTargetType.PRODUCTO;
    return this.commandService.createRule(dto);
  }
  @Post('rules/category')
  async createCategoryRule(@Body() dto: CreateCommissionRuleDto) {
    dto.tipo_objetivo = CommissionTargetType.CATEGORIA;
    return this.commandService.createRule(dto);
  }
  @Get('rules')
  async listRules() {
    return this.queryService.getAllRules();
  }

  @Patch('rules/:id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.commandService.toggleStatus(id, isActive);
  }
  @Get('calculate')
  async calculateReport(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) {
      throw new BadRequestException('Debes enviar las fechas "from" y "to"');
    }
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException(
        'Formato de fecha inválido. Usa ISO (YYYY-MM-DD)',
      );
    }

    return this.queryService.calculateCommissions(startDate, endDate);
  }
}
