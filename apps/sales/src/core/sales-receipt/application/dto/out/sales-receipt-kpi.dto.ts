export class SalesReceiptKpiDto {
  total_ventas:      number;
  cantidad_ventas:   number;
  total_boletas:     number;
  total_facturas:    number;
  cantidad_boletas:  number; 
  cantidad_facturas: number; 
  semana_desde?:     string;
  semana_hasta?:     string;
}