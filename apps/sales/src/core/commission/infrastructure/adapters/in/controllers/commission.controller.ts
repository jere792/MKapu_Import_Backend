import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommissionCommandService } from '../../../../application/service/commission-command.service';
import { CommissionQueryService }   from '../../../../application/service/commission-query.service';
import { CreateCommissionRuleDto }  from '../../../../application/dto/in/create-commission-rule.dto';
import { CommissionTargetType }     from '../../../../domain/entity/commission-rule.entity';

@Controller('commissions')
export class CommissionController {
  constructor(
    private readonly commandService: CommissionCommandService,
    private readonly queryService:   CommissionQueryService,
  ) {}

  // ── Reglas ────────────────────────────────────────────────────────────────

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

  @Put('rules/:id')
  async updateRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommissionRuleDto,
  ) {
    return this.commandService.updateRule(id, dto);
  }

  @Patch('rules/:id/status')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.commandService.toggleStatus(id, isActive);
  }

  // ── Reportes ──────────────────────────────────────────────────────────────

  @Get('report')
  async getReport(
    @Query('from') from: string,
    @Query('to')   to:   string,
  ) {
    this.validateDates(from, to);
    // getReport ya devuelve objetos planos enriquecidos, no entidades de dominio
    return this.queryService.getReport(new Date(from), new Date(to));
  }

  @Get('calculate')
  async calculateReport(
    @Query('from') from: string,
    @Query('to')   to:   string,
  ) {
    this.validateDates(from, to);
    return this.queryService.calculateCommissions(new Date(from), new Date(to));
  }

  @Get('usage-by-rule')
  async getUsageByRule() {
    return this.queryService.getUsageByRule();
  }

  // ── Atender (liquidar) comisión ───────────────────────────────────────────

  @Patch(':id/atender')
  async atender(@Param('id', ParseIntPipe) id: number) {
    const c = await this.commandService.atenderCommission(id);
    return {
      id_comision:       c.id_comision,
      id_vendedor_ref:   c.id_vendedor_ref,
      id_comprobante:    c.id_comprobante,
      porcentaje:        c.porcentaje,
      monto:             c.monto,
      estado:            c.estado,
      fecha_registro:    c.fecha_registro,
      fecha_liquidacion: c.fecha_liquidacion,
      id_regla:          c.id_regla,
    };
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private validateDates(from: string, to: string): void {
    if (!from || !to)
      throw new BadRequestException('Debes enviar las fechas "from" y "to"');
    if (isNaN(new Date(from).getTime()) || isNaN(new Date(to).getTime()))
      throw new BadRequestException('Formato de fecha inválido. Usa ISO (YYYY-MM-DD)');
  }
}