export class QuoteDetailResponseDto {
  id_detalle:  number;
  id_prod_ref: number;
  cod_prod:    string;
  descripcion: string;
  cantidad:    number;
  precio:      number;
  importe:     number;
}

export interface QuoteResponseDto {
  id_cotizacion: number;
  id_cliente:    string | null;
  id_proveedor:  string | null;
  tipo:          string;
  cliente: {
    nombre_cliente:    string;
    apellidos_cliente: string;
    direccion:         string;
    razon_social:      string;
    email:             string;
    telefono:          string;
    id_tipo_documento: string;
    valor_doc:         string;
  } | null;
  proveedor: {
    id:           string;
    razon_social: string;
    ruc:          string;
    contacto:     string;
    email:        string;
    telefono:     string;
  } | null;
  id_sede: number;
  sede: {
    nombre_sede:  string;
    codigo:       string;
    ciudad:       string;
    departamento: string;
    direccion:    string;
    telefono:     string;
  };
  fec_emision: string;
  fec_venc:    string;
  subtotal:    number;
  igv:         number;
  total:       number;
  estado:      string;
  activo:      boolean;
  detalles:    QuoteDetailResponseDto[];
}

export interface QuoteListItemDto {
  id_cotizacion:    number;
  codigo:           string;
  cliente_nombre:   string;
  proveedor_nombre?: string;  
  id_proveedor?:    number;   
  fec_emision:      string;
  fec_venc:         string;
  id_sede:          number;
  sede_nombre:      string;
  tipo:             string;
  estado:           string;
  total:            number;
  activo:           boolean;
}

export interface QuotePagedResponseDto {
  data:       QuoteListItemDto[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  kpiTotal:      number;
  kpiAprobadas:  number;
  kpiPendientes: number;
}