// application/dto/out/auction-response.dto.ts
import { AuctionDetailResponseDto } from './auction-detail-response.dto';

export class AuctionResponseDto {
  id_remate!: number;
  cod_remate!: string;
  descripcion!: string;
  fec_inicio!: Date;
  fec_fin!: Date;
  estado!: string;
  detalles!: AuctionDetailResponseDto[];
  total_items?: number; 
}