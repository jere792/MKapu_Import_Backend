/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { RemissionCommandService } from '../../../../application/service/remission-command.service';
import { CreateRemissionDto } from '../../../../application/dto/in/create-remission.dto';
import { JwtAuthGuard } from '@app/common/infrastructure/guard/jwt-auth.guard';
import { RoleGuard } from '@app/common/infrastructure/guard/roles.guard';
import { Roles } from '@app/common';
import { ListRemissionFilterDto } from '../../../../application/dto/in/list-remission-filter.dto';
import { RemissionQueryService } from '../../../../application/service/remission-query.service';
import { ChangeRemissionStatusDto } from '../../../../application/dto/in/change-remission-status.dto';

@Controller('remission')
//@UseGuards(JwtAuthGuard, RoleGuard)
export class RemissionController {
  constructor(
    private readonly service: RemissionCommandService,
    private readonly remissionQueryService: RemissionQueryService,
  ) {}

  @Post()
  //@Roles('ADMIN', 'LOGISTICS_MANAGER')
  async create(@Body() dto: CreateRemissionDto) {
    return await this.service.createRemission(dto);
  }
  @Get('sale/:correlativo')
  async findSale(@Param('correlativo') correlativo: string) {
    return await this.service.searchSaleToForward(correlativo);
  }
  @Get()
  async findAll(@Query() filter: ListRemissionFilterDto) {
    return await this.remissionQueryService.executeList(filter);
  }
  @Get('summary')
  async getSummary(@Query() filter: any) {
    return await this.remissionQueryService.executeGetSummary(filter);
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.remissionQueryService.executeFindById(id);
  }
  @Get(':id/export/excel')
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    return await this.remissionQueryService.exportExcel(id, res);
  }

  @Get(':id/export/pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    return await this.remissionQueryService.exportPdf(id, res);
  }
  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() payload: ChangeRemissionStatusDto,
  ) {
    return await this.service.changeStatus(id, payload.estado);
  }
}
