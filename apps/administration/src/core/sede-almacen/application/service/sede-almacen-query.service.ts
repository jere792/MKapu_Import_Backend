/* ============================================
   administration/src/core/sede-almacen/application/service/sede-almacen-query.service.ts
   ============================================ */

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ISedeAlmacenQueryPort } from '../../domain/ports/in/sede-almacen-ports-in';
import {
  ISedeAlmacenRepositoryPort,
  IWarehouseGatewayPort,
} from '../../domain/ports/out/sede-almacen-ports-out';
import { SedeAlmacenMapper } from '../mapper/sede-almacen.mapper';
import {
  SedeAlmacenListResponseDto,
  SedeAlmacenResponseDto,
} from '../dto/out';
import { IHeadquartersQueryPort } from '../../../headquarters/domain/ports/in/headquarters-ports-in';

@Injectable()
export class SedeAlmacenQueryService implements ISedeAlmacenQueryPort {
  constructor(
    @Inject('ISedeAlmacenRepositoryPort')
    private readonly repository: ISedeAlmacenRepositoryPort,
    @Inject('IWarehouseGatewayPort')
    private readonly warehouseGateway: IWarehouseGatewayPort,
    @Inject('IHeadquartersQueryPort')
    private readonly headquartersQuery: IHeadquartersQueryPort,
  ) {}

  async listWarehousesBySede(
    id_sede: number,
  ): Promise<SedeAlmacenListResponseDto> {
    const sedeId = Number(id_sede);
    if (!sedeId || Number.isNaN(sedeId)) {
      throw new BadRequestException(
        'id_sede es obligatorio y debe ser numerico',
      );
    }

    const sede = await this.headquartersQuery.getHeadquarterById(sedeId);
    if (!sede) {
      throw new NotFoundException(`Sede no encontrada: ${sedeId}`);
    }

    const relations = await this.repository.findBySedeId(sedeId);
    if (relations.length === 0) {
      return SedeAlmacenMapper.toListResponse(sedeId, [], {
        id_sede: sede.id_sede,
        codigo: sede.codigo,
        nombre: sede.nombre,
      });
    }

    const warehouseIds = relations.map((rel) => rel.id_almacen);
    const warehouses =
      await this.warehouseGateway.getWarehousesByIds(warehouseIds);
    const warehouseMap = new Map(
      warehouses.map((warehouse) => [warehouse.id_almacen, warehouse]),
    );

    const almacenes = relations.map((rel) => ({
      id_almacen: rel.id_almacen,
      almacen: warehouseMap.get(rel.id_almacen) ?? null,
    }));

    return SedeAlmacenMapper.toListResponse(sedeId, almacenes, {
      id_sede: sede.id_sede,
      codigo: sede.codigo,
      nombre: sede.nombre,
    });
  }

  async getAssignmentByWarehouse(
    id_almacen: number,
  ): Promise<SedeAlmacenResponseDto> {
    const warehouseId = Number(id_almacen);
    if (!warehouseId || Number.isNaN(warehouseId)) {
      throw new BadRequestException(
        'id_almacen es obligatorio y debe ser numerico',
      );
    }

    const relation = await this.repository.findByWarehouseId(warehouseId);
    if (!relation) {
      throw new NotFoundException(
        `No existe asignacion de sede para almacen ${warehouseId}`,
      );
    }

    const sede = await this.headquartersQuery.getHeadquarterById(relation.id_sede);
    return SedeAlmacenMapper.toResponseDto(
      relation,
      sede
        ? {
            id_sede: sede.id_sede,
            codigo: sede.codigo,
            nombre: sede.nombre,
          }
        : undefined,
    );
  }
}