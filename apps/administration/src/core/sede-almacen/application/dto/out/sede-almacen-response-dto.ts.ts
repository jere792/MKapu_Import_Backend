/* ============================================
   administration/src/core/sede-almacen/application/dto/out/sede-almacen-response-dto.ts
   ============================================ */

export interface SedeSummaryDto {
  id_sede: number;
  codigo: string;
  nombre: string;
}

export interface AlmacenInfoDto {
  id_almacen: number;
  codigo: string;
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
}

export interface SedeAlmacenResponseDto {
  id_sede: number;
  id_almacen: number;
  sede?: SedeSummaryDto;
  almacen?: AlmacenInfoDto | null;
}
