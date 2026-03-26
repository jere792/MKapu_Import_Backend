/* ============================================
   sales/src/core/customer/application/dto/in/register-customer-dto.ts
   ============================================ */

export interface RegisterCustomerDto {
  documentTypeId: number;
  documentValue: string;
  name: string;
  apellidos?: string;
  razon_social?: string;
  address?: string;
  email?: string;
  phone?: string;
}
