
// logistics/src/core/procurement/supplier/application/dto/in/register-supplier-dto.ts
export interface RegisterSupplierDto {
  razon_social: string;
  ruc: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
}