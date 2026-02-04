export class QuoteResponseDto {
  id_cotizacion: number;
  id_cliente: string;
  fec_emision: Date;
  fec_venc: Date;
  total: number;
  estado: string;
  activo: boolean;
}