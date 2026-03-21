import {
  RemissionStatus,
  RemissionType,
  TransportMode,
} from '../../../domain/entity/remission-domain-entity';
export class RemissionItemResponseDto {
  id_producto: number;
  cod_prod: string;
  cantidad: number;
  peso_total: number;
  peso_unitario: number;
}

export class RemissionResponseDto {
  id_guia: string;
  serie: string;
  numero: number;
  tipo_guia: RemissionType;
  fecha_emision: Date;
  fecha_inicio: Date;
  motivo_traslado: string;
  peso_total: number;
  unidad_peso: string;
  cantidad: number;
  modalidad: TransportMode;
  estado: RemissionStatus;
  id_comprobante_ref?: number;
  driverName?: string;
  vehiclePlate?: string;
  items?: RemissionItemResponseDto[];
  sede?: any;
  cliente?: any;
  venta?: any;
  usuario?: any;
}
export class RemissionListResponseDto {
  data: RemissionResponseDto[];
  total: number;
}
