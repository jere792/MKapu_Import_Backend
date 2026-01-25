// logistics/src/core/procurement/supplier/application/dto/in/update-supplier-dto.ts
export interface UpdateSupplierDto {
  id_proveedor: number;
  razon_social?: string;
  ruc?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
}
