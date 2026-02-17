// application/dto/out/auction-detail-response.dto.ts
export class AuctionDetailResponseDto {
  id_detalle_remate!: number;
  pre_original!: number;
  pre_remate!: number;
  stock_remate!: number;
  id_remate!: number;
  id_producto!: number;
  observacion?: string;
}