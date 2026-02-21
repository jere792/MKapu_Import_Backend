/* sales/src/core/sales-receipt/application/dto/out/sales-receipt-autocomplete-response.dto.ts */

export interface SalesReceiptAutocompleteResponseDto {
  clienteId: number;
  documento: string;
  nombres: string | null;
  apellidos: string | null;
  razonSocial: string | null;
  tipoComprobante: string;
  ultimaCompra: string;
  totalCompras: number;
}
