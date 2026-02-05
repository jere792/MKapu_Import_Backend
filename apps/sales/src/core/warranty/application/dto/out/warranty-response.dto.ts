/* sales/src/core/warranty/application/dto/out/warranty-response.dto.ts */

export class WarrantyDetailResponseDto {
  id_detalle?: number;
  tipo_solicitud: string;
  descripcion: string;
}

export class WarrantyTrackingResponseDto {
  id_seguimiento?: number;
  id_usuario_ref: string;
  fecha: Date;
  estado_anterior?: number;
  estado_nuevo: number;
  observacion: string;
  nombre_estado_nuevo?: string; // Opcional: Para mostrar el nombre en lugar del ID
}

export class WarrantyResponseDto {
  id_garantia: number;
  id_comprobante: number;
  id_usuario_recepcion: string;
  estado: string; // Nombre del estado actual

  fec_solicitud: Date;
  fec_recepcion?: Date;

  cod_prod: string;
  prod_nombre: string;
  num_garantia: string;

  detalles: WarrantyDetailResponseDto[];
  seguimientos: WarrantyTrackingResponseDto[];
}
