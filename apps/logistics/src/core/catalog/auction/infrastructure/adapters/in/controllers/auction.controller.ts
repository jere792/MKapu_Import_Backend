import {
  Controller, Get, Post, Put, Delete,
  Param, Query, Body,
  ParseIntPipe, HttpCode, HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuctionCommandService } from '../../../../application/service/auction-command.service';
import { AuctionQueryService }   from '../../../../application/service/auction-query.service';
import { CreateAuctionDto }      from '../../../../application/dto/in/create-auction.dto';
import { UpdateAuctionDto }      from '../../../../application/dto/in/update-auction.dto';
import { ListAuctionFilterDto }  from '../../../../application/dto/in/list-auction-filter.dto';
import { AuctionResponseDto }    from '../../../../application/dto/out/auction-response.dto';
import { AuctionAutocompleteItem } from '../../../../domain/port/out/auction.port.out';

@Controller('auctions')
export class AuctionController {
  constructor(
    private readonly commandService: AuctionCommandService,
    private readonly queryService:   AuctionQueryService,
  ) {}

  @Get('autocomplete')
  async autocomplete(
    @Query('search') search?: string,
    @Query('id_sede') id_sede?: string,
  ): Promise<{ data: AuctionAutocompleteItem[] }> {
    if (!search || search.trim().length < 2) {
      throw new BadRequestException(
        'El parámetro "search" es obligatorio y debe tener al menos 2 caracteres.',
      );
    }

    const sedeId = id_sede && Number(id_sede) > 0 ? Number(id_sede) : undefined;
    const data   = await this.queryService.autocomplete(search.trim(), sedeId);

    return { data };
  }

  // ── CRUD estándar ──────────────────────────────────────────────────────────

  /** GET /auctions */
  @Get()
  async list(@Query() filters: ListAuctionFilterDto): Promise<{
    items: AuctionResponseDto[];
    total: number;
    page:  number;
    limit: number;
  }> {
    return this.queryService.list(filters);
  }

  /** GET /auctions/:id */
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<AuctionResponseDto> {
    const dto = await this.queryService.findById(id);
    if (!dto) throw { status: HttpStatus.NOT_FOUND, message: `Auction not found: ${id}` };
    return dto;
  }

  /** POST /auctions */
  @Post()
  async create(@Body() dto: CreateAuctionDto): Promise<AuctionResponseDto> {
    return this.commandService.create(dto);
  }

  /** PUT /auctions/:id */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAuctionDto,
  ): Promise<AuctionResponseDto> {
    return this.commandService.update(id, dto as any);
  }

  /** POST /auctions/:id/finalize */
  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  async finalize(@Param('id', ParseIntPipe) id: number): Promise<AuctionResponseDto> {
    return this.commandService.finalize(id);
  }

  /** POST /auctions/:id/cancel */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id', ParseIntPipe) id: number): Promise<AuctionResponseDto> {
    return this.commandService.cancel(id);
  }

  /** DELETE /auctions/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.commandService.delete(id);
  }
}