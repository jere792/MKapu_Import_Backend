export interface CreateDispatchDto {
  id_venta_ref: number;
  id_usuario_ref: string;
  id_almacen_origen: number;
  fecha_programada?: Date;
  direccion_entrega: string;
  observacion?: string;
  detalles: CreateDispatchDetailDto[];
}

export interface CreateDispatchDetailDto {
  id_producto: number;
  cantidad_solicitada: number;
}

export interface IniciarPreparacionDto {
  id_despacho: number;
}

export interface IniciarTransitoDto {
  id_despacho: number;
  fecha_salida: Date;
}

export interface ConfirmarEntregaDto {
  id_despacho: number;
  fecha_entrega: Date;
}

export interface CancelarDespachoDto {
  id_despacho: number;
  motivo?: string;
}

export interface MarcarDetallePreparadoDto {
  id_detalle_despacho: number;
  cantidad_despachada: number;
}

export interface MarcarDetalleDespachoadoDto {
  id_detalle_despacho: number;
}