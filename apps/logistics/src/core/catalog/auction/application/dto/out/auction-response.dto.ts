// application/dto/out/auction-response.dto.ts
import { AuctionDetailResponseDto } from './auction-detail-response.dto';

export class AuctionResponseDto {
  id_remate!:      number;
  cod_remate!:     string;
  descripcion!:    string;
  estado?:         string;
  id_almacen_ref!: number;
  id_sede_ref!:    number;   
  detalles?:       AuctionDetailResponseDto[];
  total_items?:    number;
}