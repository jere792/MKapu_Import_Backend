import { DispatchStatus } from '../../../domain/entity/dispatch-domain-entity';
import { DispatchDetailStatus } from '../../../domain/entity/dispatch-detail-domain-entity';

export interface DispatchDetailOutputDto {
  id_detalle_despacho: number | null;
  id_producto: number;
  cantidad_solicitada: number;
  cantidad_despachada: number;
  estado: DispatchDetailStatus;
  tieneFaltante: boolean;
}

export interface DispatchOutputDto {
  id_despacho: number | null;
  id_venta_ref: number;
  id_usuario_ref: string;
  id_almacen_origen: number;
  fecha_creacion: Date;
  fecha_programada: Date | null;
  fecha_salida: Date | null;
  fecha_entrega: Date | null;
  direccion_entrega: string;
  observacion: string | null;
  estado: DispatchStatus;
  tieneFaltantes: boolean;
  estaActivo: boolean;
  detalles: DispatchDetailOutputDto[];
}