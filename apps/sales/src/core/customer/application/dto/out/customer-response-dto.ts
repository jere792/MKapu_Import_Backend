
/* ============================================
   sales/src/core/customer/application/dto/out/customer-response-dto.ts
   ============================================ */

export interface CustomerResponseDto {
  customerId: string;
  documentTypeId: number;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  documentValue: string;
  name: string;
  apellidos?: string;     
  razonsocial?: string;  
  address?: string;
  email?: string;
  phone?: string;
  status: boolean;
  displayName: string;   
  invoiceType: 'BOLETA' | 'FACTURA';
}
