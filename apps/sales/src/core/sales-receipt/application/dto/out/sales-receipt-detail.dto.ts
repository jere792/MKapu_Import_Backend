/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

export class SalesReceiptDetailProductoDto {
  id_prod_ref: string;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  igv: number;
  total: number;
  descuento_nombre: string | null;
  descuento_porcentaje: number | null;
  promocion_aplicada: boolean;
  descuento_promo_monto: number | null;
  descuento_promo_porcentaje: number | null;
  remate: {
    cod_remate: string;
    pre_original: number;
    pre_remate: number;
  } | null;
}

export class SalesReceiptPromocionDto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  monto_descuento: number;
  descuento_nombre: string;
  descuento_porcentaje: number;

  reglas?: {
    tipo_condicion: string;
    valor_condicion: string;
  }[];

  productosIds?: string[];
}

export class SalesReceiptHistorialItemDto {
  id_comprobante: number;
  numero_completo: string;
  fec_emision: Date;
  total: number;
  estado: string;
  metodo_pago: string;
  responsable: string;
}

export class EmpresaDetalleDto {
  id?: number;
  nombreComercial?: string;
  razonSocial?: string;
  ruc?: string;
  sitioWeb?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
  updatedAt?: string | Date;
}

export class SalesReceiptDetalleCompletoDto {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: Date;
  fec_venc: Date | null;
  estado: string;
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;

  cliente: {
    id_cliente: string;
    nombre: string;
    documento: string;
    tipo_documento: string;
    direccion: string;
    email: string;
    telefono: string;
    total_gastado_cliente: number;
    cantidad_compras: number;
  };

  productos: SalesReceiptDetailProductoDto[];

  responsable: {
    id: string;
    nombre: string;
    sede: number;
    nombreSede: string;
  };

  promocion: SalesReceiptPromocionDto | null;

  historial_cliente: SalesReceiptHistorialItemDto[];

  historial_pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };

  empresa?: EmpresaDetalleDto | any;
}

export class ReglaPromocionDto {
  id_regla: number;
  tipo_condicion: 'PRODUCTO' | 'CATEGORIA' | 'CLIENTE_NUEVO' | 'MINIMO_COMPRA';
  valor_condicion: string;
}

export class PromocionActivaDto {
  idPromocion: number;
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean;
  reglas: ReglaPromocionDto[];
}
