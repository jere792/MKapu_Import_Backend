export interface SupplierResponseDto {
  id_proveedor: number;
  razon_social: string;
  ruc: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
  estado: boolean;
}