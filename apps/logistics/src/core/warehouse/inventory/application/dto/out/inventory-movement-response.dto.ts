export class InventoryMovementDetailResponseDto {
  id: number;
  productoNombre: string;
  cantidad: number;
  unidadMedida: string;
}

export class InventoryMovementResponseDto {
  id: number;
  tipoMovimiento: string;
  fechaMovimiento: Date;
  motivo: string;
  documentoReferencia: string;
  usuario: string;
  sedeNombre?: string;
  almacenOrigenNombre: string | null;
  almacenDestinoNombre: string | null;
  detalles: InventoryMovementDetailResponseDto[];
}
