/* ============================================
   administration/src/core/sede-almacen/application/mapper/sede-almacen.mapper.ts
   ============================================ */

import { SedeAlmacen } from '../../domain/entity/sede-almacen-domain-entity';
import { SedeAlmacenOrmEntity } from '../../infrastructure/entity/sede-almacen-orm.entity';
import {
  SedeAlmacenResponseDto,
  SedeSummaryDto,
  AlmacenInfoDto,
  SedeAlmacenListResponseDto,
  SedeAlmacenListItemDto,
} from '../dto/out';

export class SedeAlmacenMapper {
  static toDomainEntity(entity: SedeAlmacenOrmEntity): SedeAlmacen {
    return SedeAlmacen.create({
      id_sede: entity.id_sede,
      id_almacen: entity.id_almacen,
    });
  }

  static toOrmEntity(domain: SedeAlmacen): SedeAlmacenOrmEntity {
    const orm = new SedeAlmacenOrmEntity();
    orm.id_sede = domain.id_sede;
    orm.id_almacen = domain.id_almacen;
    return orm;
  }

  static toResponseDto(
    domain: SedeAlmacen,
    sede?: SedeSummaryDto,
    almacen?: AlmacenInfoDto | null,
  ): SedeAlmacenResponseDto {
    return {
      id_sede: domain.id_sede,
      id_almacen: domain.id_almacen,
      sede,
      almacen: almacen ?? null,
    };
  }

  static toListResponse(
    id_sede: number,
    almacenes: SedeAlmacenListItemDto[],
    sede?: SedeSummaryDto,
  ): SedeAlmacenListResponseDto {
    return {
      id_sede,
      sede,
      almacenes,
      total: almacenes.length,
    };
  }
}