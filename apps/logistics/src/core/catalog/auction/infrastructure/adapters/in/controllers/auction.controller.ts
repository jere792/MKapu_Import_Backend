import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AuctionCommandService } from '../../../../application/service/auction-command.service';
import { AuctionQueryService } from '../../../../application/service/auction-query.service';
import { CreateAuctionDto } from '../../../../application/dto/in/create-auction.dto';
import { ListAuctionFilterDto } from '../../../../application/dto/in/list-auction-filter.dto';
import { AuctionResponseDto } from '../../../../application/dto/out/auction-response.dto';

@Controller('auctions')
export class AuctionController {
  constructor(
    private readonly commandService: AuctionCommandService,
    private readonly queryService: AuctionQueryService,
  ) {}

  /**
   * List (paged) auctions
   * GET /auctions?page=1&limit=10&search=...&estado=ACTIVO
   */
  @Get()
  async list(@Query() filters: ListAuctionFilterDto): Promise<{
    items: AuctionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.queryService.list(filters);
  }

  /**
   * Get by id
   */
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<AuctionResponseDto> {
    const dto = await this.queryService.findById(id);
    if (!dto) {
      // Let Nest error handling handle converting null to 404 in your controller guard
      // or throw NotFoundException here if you prefer explicit behaviour.
      // For consistency with other controllers you can throw NotFoundException.
      throw { status: HttpStatus.NOT_FOUND, message: `Auction not found: ${id}` };
    }
    return dto;
  }

  /**
   * Create auction
   */
  @Post()
  async create(@Body() dto: CreateAuctionDto): Promise<AuctionResponseDto> {
    return this.commandService.create(dto);
  }

  /**
   * Update auction
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAuctionDto,
  ): Promise<AuctionResponseDto> {
    return this.commandService.update(id, dto);
  }

  /**
   * Finalize auction (force close)
   * POST /auctions/:id/finalize
   */
  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  async finalize(@Param('id', ParseIntPipe) id: number): Promise<AuctionResponseDto> {
    return this.commandService.finalize(id);
  }

  /**
   * Delete auction
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.commandService.delete(id);
  }
}