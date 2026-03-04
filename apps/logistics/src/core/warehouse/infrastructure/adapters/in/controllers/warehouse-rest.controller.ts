import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, Query, BadRequestException } from '@nestjs/common';
import { CreateWarehouseDto } from '../../../../application/dto/in/create-warehouse.dto';
import { UpdateWarehouseDto } from '../../../../application/dto/in/update-warehouse.dto';
import { UpdateWarehouseStatusDto } from '../../../../application/dto/in/update-warehouse-status.dto';
import { ListWarehousesFilterDto } from '../../../../application/dto/in/list-warehouses-filter.dto';
import { WarehouseCommandService } from '../../../../application/service/warehouse-command.service';
import { WarehouseQueryService } from '../../../../application/service/warehouse-query.service';
import { WarehouseMapper } from '../../../../application/mapper/warehouse-mapper';
import { WarehouseListResponse } from '../../../../application/dto/out/warehouse-list-response.dto';

// ← elimina la clase UpdateWarehouseStatusDto de aquí

@Controller('warehouses')
export class WarehouseRestController {
  constructor(
    private readonly query: WarehouseQueryService,
    private readonly command: WarehouseCommandService,
  ) {}

  @Get()
  async list(@Query() filters: ListWarehousesFilterDto): Promise<WarehouseListResponse> {
    return this.query.listPaginated(filters);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const item = await this.query.getById(id);
    return item ? WarehouseMapper.toResponseDto(item) : null;
  }

  @Post()
  async create(@Body() dto: CreateWarehouseDto) {
    try {
      const domain = WarehouseMapper.fromCreateDto(dto);
      const created = await this.command.create(domain);
      return WarehouseMapper.toResponseDto(created);
    } catch (err: any) {
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWarehouseDto) {
    try {
      const updated = await this.command.update(id, dto as any);
      return WarehouseMapper.toResponseDto(updated);
    } catch (err: any) {
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWarehouseStatusDto,
  ) {
    console.log('[Controller] updateStatus dto=', dto, 'activo=', dto.activo);
    const updated = await this.command.updateStatus(id, dto.activo);
    return WarehouseMapper.toResponseDto(updated);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const updated = await this.command.updateStatus(id, false);
      return { ok: true, data: WarehouseMapper.toResponseDto(updated) };
    } catch (err: any) {
      if (err instanceof Error) throw new BadRequestException(err.message);
      throw err;
    }
  }
}