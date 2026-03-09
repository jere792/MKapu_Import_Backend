export class SalesReceiptDetailProductoDto {
  id_prod_ref:          string;
  cod_prod:             string;
  descripcion:          string;
  cantidad:             number;
  precio_unit:          number;
  igv:                  number;
  total:                number;
  descuento_nombre:     string | null;   // ← nuevo
  descuento_porcentaje: number | null;   // ← nuevo
}


export class SalesReceiptPromocionDto {                // ← nuevo
  id:                   number;
  codigo:               string;
  nombre:               string;
  tipo:                 string;
  monto_descuento:      number;
  descuento_nombre:     string;
  descuento_porcentaje: number;
}


export class SalesReceiptHistorialItemDto {
  id_comprobante:  number;
  numero_completo: string;
  fec_emision:     Date;
  total:           number;
  estado:          string;
  metodo_pago:     string;
  responsable:     string;
}


export class SalesReceiptDetalleCompletoDto {
  id_comprobante:  number;
  numero_completo: string;
  serie:           string;
  numero:          number;
  tipo_comprobante:string;
  fec_emision:     Date;
  fec_venc:        Date | null;          // ← nuevo
  estado:          string;
  subtotal:        number;
  igv:             number;
  total:           number;
  metodo_pago:     string;

  cliente: {
    id_cliente:            string;
    nombre:                string;
    documento:             string;
    tipo_documento:        string;
    direccion:             string;
    email:                 string;
    telefono:              string;
    total_gastado_cliente: number;
    cantidad_compras:      number;
  };

  productos: SalesReceiptDetailProductoDto[];

  responsable: {
    id:         string;
    nombre:     string;
    sede:       number;
    nombreSede: string;
  };

  promocion: SalesReceiptPromocionDto | null;          // ← nuevo

  historial_cliente: SalesReceiptHistorialItemDto[];

  historial_pagination: {
    total:       number;
    page:        number;
    limit:       number;
    total_pages: number;
  };
}


// ─── Promociones activas (para generar nueva venta) ──────────────────────────

export class ReglaPromocionDto {
  id_regla:        number;
  tipo_condicion:  'PRODUCTO' | 'CATEGORIA' | 'CLIENTE_NUEVO' | 'MINIMO_COMPRA';
  valor_condicion: string;
}

export class PromocionActivaDto {
  idPromocion: number;
  concepto:    string;
  tipo:        string;
  valor:       number;
  activo:      boolean;
  reglas:      ReglaPromocionDto[];
}
