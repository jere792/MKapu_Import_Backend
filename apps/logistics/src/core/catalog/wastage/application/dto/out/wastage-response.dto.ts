import { WastageDetailResponseDto } from './wastage-detail-response.dto';

export class WastageResponseDto {
  id_merma!:         number;
  fec_merma!:        Date | string;
  motivo!:           string;
  total_items!:      number;
  estado!:           boolean;
  id_sede_ref!:      number;      
  id_almacen_ref!:   number;     
  detalles?:         WastageDetailResponseDto[];
  responsable?:      string;
  tipo_merma_id?:    number | null;
  tipo_merma_label?: string | null;
}

export class WastagePaginatedResponseDto {
  data:       WastageResponseDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}