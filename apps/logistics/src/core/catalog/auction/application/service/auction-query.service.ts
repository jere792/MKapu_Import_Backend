import { Injectable, Inject, Logger } from '@nestjs/common';
import { ListAuctionFilterDto } from '../dto/in/list-auction-filter.dto';
import { AuctionMapper } from '../mapper/auction.mapper';
import { AuctionResponseDto } from '../dto/out/auction-response.dto';
import { IAuctionRepositoryPort, AuctionAutocompleteItem } from '../../domain/port/out/auction.port.out';

@Injectable()
export class AuctionQueryService {
  private readonly logger = new Logger(AuctionQueryService.name);

  constructor(
    @Inject('IAuctionRepositoryPort')
    private readonly repository: IAuctionRepositoryPort,
  ) {}

  /**
   * Lista paginada de subastas (remates).
   */
  async list(filters: ListAuctionFilterDto): Promise<{
    items: AuctionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page  = filters.page  && filters.page  > 0 ? filters.page  : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;

    this.logger.debug(
      `Listing auctions - page=${page} limit=${limit} search=${filters.search ?? ''} estado=${filters.estado ?? ''}`,
    );

    const { items: domains, total } = await this.repository.findPaged({
      ...filters,
      page,
      limit,
    });

    const items = (domains || []).map((d) => AuctionMapper.toResponseDto(d));

    return { items, total: total ?? 0, page, limit };
  }

  /**
   * Obtiene una subasta por id. Retorna null si no existe.
   */
  async findById(id: number): Promise<AuctionResponseDto | null> {
    if (!id || Number.isNaN(Number(id))) return null;

    this.logger.debug(`Finding auction by id=${id}`);
    const domain = await this.repository.findById(id);
    if (!domain) return null;

    return AuctionMapper.toResponseDto(domain);
  }

  /**
   * Autocomplete de ítems en remates ACTIVOS con stock > 0.
   * Busca por descripción del detalle o cod_remate del remate padre.
   *
   * @param search   texto mínimo (se valida en controller)
   * @param id_sede  filtra por sede (opcional)
   */
  async autocomplete(
    search: string,
    id_sede?: number,
  ): Promise<AuctionAutocompleteItem[]> {
    this.logger.debug(
      `Autocomplete remates - search="${search}" id_sede=${id_sede ?? 'all'}`,
    );
    return this.repository.autocomplete(search, id_sede);
  }
}