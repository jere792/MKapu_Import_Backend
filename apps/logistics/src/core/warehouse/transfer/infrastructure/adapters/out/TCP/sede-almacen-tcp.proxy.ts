import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

type FindWarehouseIdsBySedeReply =
  | {
      ok: true;
      data: {
        id_sede: string;
        warehouseIds: number[];
      } | null;
      message?: string;
    }
  | {
      ok: false;
      data: null;
      message?: string;
    };

type FindHeadquartersByWarehouseIdsReply =
  | {
      ok: true;
      data: Array<{
        id_almacen: number;
        id_sede: string;
        nombre: string | null;
      }>;
      message?: string;
    }
  | {
      ok: false;
      data: [];
      message?: string;
    };

export type HeadquartersWarehouseAssignment = {
  id_sede: string;
  nombre: string | null;
};

@Injectable()
export class SedeAlmacenTcpProxy implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SedeAlmacenTcpProxy.name);

  constructor(
    @Inject('SEDE_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        `No se pudo conectar a SEDE_SERVICE: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch {
      // noop
    }
  }

  async findWarehouseIdsBySede(headquartersId: string): Promise<number[]> {
    const normalizedHeadquartersId = String(headquartersId ?? '').trim();
    if (!normalizedHeadquartersId) {
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.client
          .send<FindWarehouseIdsBySedeReply>(
            'sede_almacen.findWarehouseIdsBySede',
            {
              id_sede: normalizedHeadquartersId,
            },
          )
          .pipe(timeout(5000)),
      );

      if (!response || response.ok === false || !response.data) {
        return [];
      }

      return Array.from(
        new Set(
          (response.data.warehouseIds ?? [])
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0),
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Error consultando almacenes por sede via TCP: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
      return [];
    }
  }

  async findHeadquartersByWarehouseIds(
    warehouseIds: number[],
  ): Promise<Map<number, HeadquartersWarehouseAssignment>> {
    const normalizedWarehouseIds = Array.from(
      new Set(
        (warehouseIds ?? [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (normalizedWarehouseIds.length === 0) {
      return new Map();
    }

    try {
      const response = await firstValueFrom(
        this.client
          .send<FindHeadquartersByWarehouseIdsReply>(
            'sede_almacen.findHeadquartersByWarehouseIds',
            {
              warehouseIds: normalizedWarehouseIds,
            },
          )
          .pipe(timeout(5000)),
      );

      if (!response || response.ok === false) {
        return new Map();
      }

      return new Map(
        (response.data ?? [])
          .map((assignment) => {
            const warehouseId = Number(assignment.id_almacen);
            const headquarterId = String(assignment.id_sede ?? '').trim();
            if (
              !Number.isInteger(warehouseId) ||
              warehouseId <= 0 ||
              !headquarterId
            ) {
              return null;
            }

            return [
              warehouseId,
              {
                id_sede: headquarterId,
                nombre: assignment.nombre ?? null,
              },
            ] as const;
          })
          .filter(
            (
              entry,
            ): entry is readonly [number, HeadquartersWarehouseAssignment] =>
              entry !== null,
          ),
      );
    } catch (error) {
      this.logger.warn(
        `Error consultando sedes por almacen via TCP: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
      return new Map();
    }
  }

  async findHeadquarterByWarehouseId(
    warehouseId: number,
  ): Promise<HeadquartersWarehouseAssignment | null> {
    const assignments = await this.findHeadquartersByWarehouseIds([
      warehouseId,
    ]);
    return assignments.get(warehouseId) ?? null;
  }
}
