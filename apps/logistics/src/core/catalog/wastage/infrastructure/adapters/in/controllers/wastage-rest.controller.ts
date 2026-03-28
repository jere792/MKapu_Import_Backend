import {
  Controller, Get, Post, Put, Body,
  Param, Query, Inject,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { IWastageCommandPort } from '../../../../domain/ports/in/wastage.port.in';
import { IWastageQueryPort }   from '../../../../domain/ports/in/wastage.port.in';
import { CreateWastageDto }    from '../../../../application/dto/in/create-wastage.dto';
import { UpdateWastageDto }    from '../../../../application/dto/in/update-wastage.dto';
import { WastageResponseDto, WastagePaginatedResponseDto } from '../../../../application/dto/out/wastage-response.dto';
import { WastageTypeService }     from '../../../../application/service/wastage-type.service';
import { WastageTypeResponseDto } from '../../../../application/dto/out/wastage-type-response.dto';
import { WastageSuggestionDto }   from '../../../../application/dto/out/wastage-suggestion-response.dto';


@Controller('catalog/wastage')
export class WastageRestController {
  constructor(
    @Inject('IWastageCommandPort')
    private readonly commandPort: IWastageCommandPort,

    @Inject('IWastageQueryPort')
    private readonly queryPort: IWastageQueryPort,

    private readonly wastageTypeService: WastageTypeService,
  ) {}


  // ── POST /catalog/wastage ─────────────────────────────────────────────────
  @Post()
  async create(@Body() dto: CreateWastageDto): Promise<WastageResponseDto> {
    return await this.commandPort.create(dto);
  }

  // ── PUT /catalog/wastage/:id ──────────────────────────────────────────────
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: { motivo?: string; id_tipo_merma?: number; observacion?: string },
  ): Promise<WastageResponseDto> {
    return await this.commandPort.update(id, payload);

  }

  // ── GET /catalog/wastage/tipos ────────────────────────────────────────────
  @Get('tipos')
  async findTipos(): Promise<WastageTypeResponseDto[]> {
    return await this.wastageTypeService.findAll();
  }

  // ── GET /catalog/wastage/search?q=daño&id_sede=1&limit=8 ─────────────────
  @Get('search')
  async search(
    @Query('q')                                              q:       string,
    @Query('id_sede', new DefaultValuePipe(0), ParseIntPipe) id_sede: number,
    @Query('limit',   new DefaultValuePipe(8), ParseIntPipe) limit:   number,
  ): Promise<WastageSuggestionDto[]> {
    if (!q || q.trim().length < 1) return [];
    return await this.queryPort.search(q.trim(), id_sede || undefined, limit);
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
