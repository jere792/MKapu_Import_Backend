// quote-list-response.dto.ts
export interface QuoteListItemDto {
  id_cotizacion:    number;
  codigo:           string;
  cliente_nombre:   string;
  proveedor_nombre?: string; 
  id_proveedor?:    number;   
  fec_emision:      string;
  fec_venc:         string;
  id_sede:          number;
  sede_nombre:      string;
  tipo:             string;
  estado:           string;
  total:            number;
  activo:           boolean;
}

export interface QuotePagedResponseDto {
  data: QuoteListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}