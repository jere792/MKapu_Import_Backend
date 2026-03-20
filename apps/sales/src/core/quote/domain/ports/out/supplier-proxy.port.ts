export interface SupplierInfo {
  id_proveedor: number;
  razon_social: string;
  ruc:          string;
  contacto:     string | null;
  email:        string | null;
  telefono:     string | null;
  dir_fiscal:   string | null;
}

export interface ISupplierProxy {
  getSupplierById(id_proveedor: number): Promise<SupplierInfo | null>;
}

export const SUPPLIER_PROXY = 'ISupplierProxy';