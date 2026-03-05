/* ============================================
   administration/src/core/sede-almacen/application/dto/out/sede-almacen-list-response.ts
   ============================================ */

import { AlmacenInfoDto, SedeSummaryDto } from './sede-almacen-response-dto.ts';

export interface SedeAlmacenListItemDto {
  id_almacen: number;
  almacen?: AlmacenInfoDto | null;
}

export interface SedeAlmacenListResponseDto {
  id_sede: number;
  sede?: SedeSummaryDto;
  almacenes: SedeAlmacenListItemDto[];
  total: number;
}
