// application/mapper/auction.mapper.ts
import { Auction } from '../../domain/entity/auction-domain-entity';
import { AuctionResponseDto } from '../dto/out/auction-response.dto';
import { AuctionDetailResponseDto } from '../dto/out/auction-detail-response.dto';

export class AuctionMapper {
  static detailToResponseDto(detail: any /* AuctionDetailRef */): AuctionDetailResponseDto {
    return {
      id_detalle_remate: detail.id_detalle_remate as number | undefined,
      pre_original: detail.originalPrice,
      pre_remate: detail.auctionPrice,
      stock_remate: detail.auctionStock,
      id_remate: detail.id_remate ?? undefined,
      id_producto: detail.productId,
      observacion: detail.observacion ?? undefined,
    };
  }

  static toResponseDto(domain: Auction): AuctionResponseDto {
    const dto = new AuctionResponseDto();
    dto.id_remate = domain.id!;
    dto.cod_remate = domain.code;
    dto.descripcion = domain.description;
    dto.fec_inicio = domain.startAt;
    dto.fec_fin = domain.endAt;
    dto.estado = domain.status;
    dto.detalles = (domain.details || []).map(d => this.detailToResponseDto(d));
    dto.total_items = domain.totalItems();
    return dto;
  }
}