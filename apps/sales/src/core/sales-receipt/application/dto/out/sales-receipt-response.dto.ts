export class SalesReceiptResponseDto {
  idComprobante: number;
  idCliente: string;
  numeroCompleto: string;
  serie: string;
  numero: number;
  fecEmision: Date;
  fecVenc?: Date; 
  tipoOperacion: string; 
  subtotal: number; 
  igv: number; 
  isc: number; 
  total: number;
  estado: string;
  codMoneda: string; 
  idTipoComprobante: number; 
  idTipoVenta: number; 
  idSedeRef: number; 
  idResponsableRef: string; 
  items: SalesReceiptItemResponseDto[];
}

export class SalesReceiptItemResponseDto {
  productId: string;
  productName: string; 
  codigoProducto?: string; 
  quantity: number;
  unitPrice: number; 
  unitValue: number; 
  igv: number;
  tipoAfectacionIgv: number; 
  total: number;
}