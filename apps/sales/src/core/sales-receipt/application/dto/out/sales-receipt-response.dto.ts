/* ============================================
   apps/sales/src/core/sales-receipt/application/dto/out/sales-receipt-response.dto.ts
   ============================================ */

export interface SalesReceiptResponseDto {
  idComprobante:   number;
  numeroCompleto:  string;
  serie:           string;
  numero:          number;
  fecEmision:      Date;
  fecVenc?:        Date;
  tipoOperacion:   string;
  subtotal:        number;
  igv:             number;
  isc:             number;
  total:           number;
  estado:          string;
  cliente:         SalesReceiptCustomerResponseDto;
  responsable:     SalesReceiptEmployeeResponseDto;
  tipoComprobante: SalesReceiptTypeResponseDto;
  tipoVenta:       SalesTypeResponseDto;
  sede:            BranchResponseDto;
  metodoPago?:     PaymentMethodResponseDto;
  moneda:          CurrencyResponseDto;
  items:           SalesReceiptItemResponseDto[];
}

export interface SalesReceiptItemResponseDto {
  productId:          string;
  productName:        string;
  codigoProducto?:    string;
  quantity:           number;
  unitPrice:          number;
  unitValue:          number;
  igv:                number;
  tipoAfectacionIgv:  number;
  total:              number;
}

export interface SalesReceiptCustomerResponseDto {
  id:                      string;
  documentTypeId:          number;
  documentTypeDescription: string;
  documentTypeSunatCode:   string;
  documentValue:           string;
  name:                    string;
  address?:                string;
  email?:                  string;
  phone?:                  string;
  status:                  boolean;
}

export interface SalesReceiptEmployeeResponseDto {
  id:              number;
  nombre:          string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto:  string;
}

export interface SalesReceiptTypeResponseDto {
  id:          number;
  codigoSunat: string;
  descripcion: string;
}

export interface SalesTypeResponseDto {
  id:          number;
  tipo:        string;
  descripcion: string;
}

export interface BranchResponseDto {
  id:     number;
  nombre: string;
}

export interface PaymentMethodResponseDto {
  id:           number;
  codigoSunat?: string;
  descripcion:  string;
}

export interface CurrencyResponseDto {
  codigo:      string;
  descripcion: string;
}
