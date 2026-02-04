/* apps/sales/src/core/quote/application/dto/in/create-quote.dto.ts */
export class CreateQuoteDto {
  documento_cliente: string; // En lugar de id_cliente (UUID)
  fec_venc: Date;
  subtotal: number;
  igv: number;
  total: number;
}