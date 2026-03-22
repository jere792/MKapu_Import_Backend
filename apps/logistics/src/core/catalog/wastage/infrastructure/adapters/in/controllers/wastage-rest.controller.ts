import {
  Controller, Get, Post, Body,
  Param, Query, Inject,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { IWastageCommandPort } from '../../../../domain/ports/in/wastage.port.in';
import { IWastageQueryPort }   from '../../../../domain/ports/in/wastage.port.in';
import { CreateWastageDto }    from '../../../../application/dto/in/create-wastage.dto';
import { WastageResponseDto, WastagePaginatedResponseDto } from '../../../../application/dto/out/wastage-response.dto';
import { WastageTypeService }     from '../../../../application/service/wastage-type.service';
import { WastageTypeResponseDto } from '../../../../application/dto/out/wastage-type-response.dto';

@Controller('catalog/wastage')
export class WastageRestController {
  constructor(
    @Inject('IWastageCommandPort')
    private readonly commandPort: IWastageCommandPort,

    @Inject('IWastageQueryPort')
    private readonly queryPort: IWastageQueryPort,

    // ── Servicio de tipos de merma (inyección directa, no por token) ─────
    private readonly wastageTypeService: WastageTypeService,
  ) {}

  // ── POST /catalog/wastage ─────────────────────────────────────────────────
  @Post()
  async create(@Body() dto: CreateWastageDto): Promise<WastageResponseDto> {
    return await this.commandPort.create(dto);
  }

  // ── GET /catalog/wastage/tipos ────────────────────────────────────────────
  @Get('tipos')
  async findTipos(): Promise<WastageTypeResponseDto[]> {
    return await this.wastageTypeService.findAll();
  }

  // ── GET /catalog/wastage ──────────────────────────────────────────────────
  @Get()
  async findAll(
    @Query('page',    new DefaultValuePipe(1),  ParseIntPipe) page:    number,
    @Query('limit',   new DefaultValuePipe(10), ParseIntPipe) limit:   number,
    @Query('id_sede', new DefaultValuePipe(0),  ParseIntPipe) id_sede: number,
  ): Promise<WastagePaginatedResponseDto> {
    return await this.queryPort.findAllPaginated(page, limit, id_sede || undefined);
  }
  // ── GET /catalog/wastage/:id ──────────────────────────────────────────────
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<WastageResponseDto> {
    return await this.queryPort.findById(id);
  }
}