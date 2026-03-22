import { Auction } from '../../domain/entity/auction-domain-entity';
import { AuctionResponseDto } from '../dto/out/auction-response.dto';
import { AuctionDetailResponseDto } from '../dto/out/auction-detail-response.dto';

export class AuctionMapper {
  static detailToResponseDto(detail: any): AuctionDetailResponseDto {
    return {
      id_detalle_remate: detail.id_detalle_remate,
      pre_original:      detail.originalPrice,
      pre_remate:        detail.auctionPrice,
      stock_remate:      detail.auctionStock,
      id_remate:         detail.id_remate    ?? undefined,
      id_producto:       detail.productId,
      observacion:       detail.observacion  ?? undefined,
    };
  }

  static toResponseDto(domain: Auction): AuctionResponseDto {
    const dto          = new AuctionResponseDto();
    dto.id_remate      = domain.id!;
    dto.cod_remate     = domain.code;
    dto.descripcion    = domain.description;
    dto.estado         = domain.status;
    dto.id_almacen_ref = domain.warehouseRefId;
    dto.id_sede_ref    = domain.sedeRefId;    
    dto.detalles       = (domain.details || []).map(d => this.detailToResponseDto(d));
    dto.total_items    = domain.totalItems();
    return dto;
  }
}