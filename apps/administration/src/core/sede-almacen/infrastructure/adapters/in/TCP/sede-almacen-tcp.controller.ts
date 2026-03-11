import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IHeadquartersQueryPort } from '../../../../../headquarters/domain/ports/in/headquarters-ports-in';
import { ISedeAlmacenRepositoryPort } from 'apps/administration/src/core/headquarters-warehouse/domain/ports/out/sede-almacen-ports-out';

type GetWarehouseIdsBySedePayload = {
  id_sede: number | string;
};

type GetHeadquartersByWarehousesPayload = {
  warehouseIds: number[] | string[];
};

@Controller()
export class SedeAlmacenTcpController {
  private readonly logger = new Logger(SedeAlmacenTcpController.name);

  constructor(
    @Inject('ISedeAlmacenRepositoryPort')
    private readonly repository: ISedeAlmacenRepositoryPort,
    @Inject('IHeadquartersQueryPort')
    private readonly headquartersQueryPort: IHeadquartersQueryPort,
  ) {}

  @MessagePattern('sede_almacen.findWarehouseIdsBySede')
  async findWarehouseIdsBySede(@Payload() payload: GetWarehouseIdsBySedePayload) {
    const idSede = Number(String(payload?.id_sede ?? '').trim());
    if (!Number.isInteger(idSede) || idSede <= 0) {
      return { ok: false, data: null, message: 'id_sede invalido' };
    }

    const relations = await this.repository.findBySedeId(idSede);
    const warehouseIds = relations
      .map((relation) => Number(relation.id_almacen))
      .filter((warehouseId) => Number.isInteger(warehouseId) && warehouseId > 0);

    this.logger.log(
      `TCP sede_almacen.findWarehouseIdsBySede -> sede=${idSede}, almacenes=${warehouseIds.length}`,
    );

    return {
      ok: true,
      data: {
        id_sede: String(idSede),
        warehouseIds,
      },
    };
  }

  @MessagePattern('sede_almacen.findHeadquartersByWarehouseIds')
  async findHeadquartersByWarehouseIds(
    @Payload() payload: GetHeadquartersByWarehousesPayload,
  ) {
    const warehouseIds = Array.isArray(payload?.warehouseIds)
      ? Array.from(
          new Set(
            payload.warehouseIds
              .map((value) => Number(String(value).trim()))
              .filter((warehouseId) => Number.isInteger(warehouseId) && warehouseId > 0),
          ),
        )
      : [];

    if (warehouseIds.length === 0) {
      return { ok: true, data: [] };
    }

    const relations = await this.repository.findByWarehouseIds(warehouseIds);
    const headquarterIds = Array.from(
      new Set(relations.map((relation) => relation.id_sede)),
    );

    const headquarterEntries = await Promise.all(
      headquarterIds.map(async (id_sede) => {
        const headquarter = await this.headquartersQueryPort.getHeadquarterById(id_sede);
        return [
          id_sede,
          headquarter?.nombre ?? null,
        ] as const;
      }),
    );

    const headquartersNameMap = new Map<number, string | null>(headquarterEntries);
    const data = relations.map((relation) => ({
      id_almacen: relation.id_almacen,
      id_sede: String(relation.id_sede),
      nombre: headquartersNameMap.get(relation.id_sede) ?? null,
    }));

    this.logger.log(
      `TCP sede_almacen.findHeadquartersByWarehouseIds -> almacenes=${warehouseIds.length}, asignaciones=${data.length}`,
    );

    return {
      ok: true,
      data,
    };
  }
}

