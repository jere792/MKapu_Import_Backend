import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WarehouseQueryService } from '../../../../application/service/warehouse-query.service';

type FindWarehousesByIdsPayload = {
  ids: number[] | string[];
  secret?: string;
};

type FindWarehousesByIdsResponse = {
  ok: boolean;
  data?: Array<{
    id_almacen: number;
    codigo: string;
    nombre?: string | null;
    departamento?: string | null;
    provincia?: string | null;
    ciudad?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    activo: boolean;
  }>;
  message?: string;
};

@Controller()
export class WarehouseTcpController {
  private readonly logger = new Logger(WarehouseTcpController.name);

  constructor(private readonly warehouseQuery: WarehouseQueryService) {}

  @MessagePattern('almacenes.findByIds')
  async findByIds(
    @Payload() payload: FindWarehousesByIdsPayload,
  ): Promise<FindWarehousesByIdsResponse> {
    try {
      const rawIds = payload?.ids ?? [];
      const ids = Array.isArray(rawIds)
        ? rawIds
            .map((v) => Number(String(v).trim()))
            .filter((n) => !Number.isNaN(n) && n > 0)
        : [];

      if (ids.length === 0) {
        return { ok: true, data: [] };
      }

      if (ids.length > 100) {
        return {
          ok: false,
          message: 'Demasiados IDs solicitados. Maximo: 100',
          data: [],
        };
      }

      const warehouses = await this.warehouseQuery.getByIds(ids);
      const data = warehouses.map((warehouse) => ({
        id_almacen: warehouse.id ?? 0,
        codigo: warehouse.codigo,
        nombre: warehouse.nombre ?? null,
        departamento: warehouse.departamento ?? null,
        provincia: warehouse.provincia ?? null,
        ciudad: warehouse.ciudad ?? null,
        direccion: warehouse.direccion ?? null,
        telefono: warehouse.telefono ?? null,
        activo: warehouse.activo,
      }));

      this.logger.log(`TCP almacenes.findByIds -> ${data.length} result(s)`);
      return { ok: true, data };
    } catch (error: any) {
      this.logger.error(
        `Error en almacenes.findByIds: ${error?.message ?? error}`,
      );
      return {
        ok: false,
        message: 'Error al consultar almacenes',
        data: [],
      };
    }
  }
}