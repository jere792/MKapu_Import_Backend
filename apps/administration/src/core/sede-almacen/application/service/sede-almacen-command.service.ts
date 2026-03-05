import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ISedeAlmacenCommandPort } from '../../domain/ports/in/sede-almacen-ports-in';
import {
  ISedeAlmacenRepositoryPort,
  IWarehouseGatewayPort,
} from '../../domain/ports/out/sede-almacen-ports-out';
import { AssignWarehouseToSedeDto } from '../dto/in';
import { SedeAlmacenResponseDto } from '../dto/out';
import { SedeAlmacenMapper } from '../mapper/sede-almacen.mapper';
import { SedeAlmacen } from '../../domain/entity/sede-almacen-domain-entity';
import { IHeadquartersQueryPort } from '../../../headquarters/domain/ports/in/headquarters-ports-in';

@Injectable()
export class SedeAlmacenCommandService implements ISedeAlmacenCommandPort {
  constructor(
    @Inject('ISedeAlmacenRepositoryPort')
    private readonly repository: ISedeAlmacenRepositoryPort,
    @Inject('IWarehouseGatewayPort')
    private readonly warehouseGateway: IWarehouseGatewayPort,
    @Inject('IHeadquartersQueryPort')
    private readonly headquartersQuery: IHeadquartersQueryPort,
  ) {}

  async assignWarehouseToSede(
    dto: AssignWarehouseToSedeDto,
  ): Promise<SedeAlmacenResponseDto> {
    const sedeId = Number(dto.id_sede);
    const almacenId = Number(dto.id_almacen);

    if (!sedeId || Number.isNaN(sedeId))
      throw new BadRequestException(
        'id_sede es obligatorio y debe ser numerico',
      );
    if (!almacenId || Number.isNaN(almacenId))
      throw new BadRequestException(
        'id_almacen es obligatorio y debe ser numerico',
      );

    const sede = await this.headquartersQuery.getHeadquarterById(sedeId);
    if (!sede) throw new NotFoundException(`Sede no encontrada: ${sedeId}`);
    if (sede.activo === false)
      throw new ConflictException('La sede esta inactiva');

    const almacen = await this.warehouseGateway.getWarehouseById(almacenId);
    if (!almacen)
      throw new NotFoundException(`Almacen no encontrado: ${almacenId}`);
    if (almacen.activo === false)
      throw new ConflictException('El almacen esta inactivo');

    const existing = await this.repository.findByWarehouseId(almacenId);
    if (existing) {
      if (existing.id_sede === sedeId) {
        return SedeAlmacenMapper.toResponseDto(
          existing,
          { id_sede: sede.id_sede, codigo: sede.codigo, nombre: sede.nombre },
          almacen,
        );
      }
      throw new ConflictException(
        `El almacen ${almacenId} ya esta asignado a la sede ${existing.id_sede}`,
      );
    }

    const saved = await this.repository.save(
      SedeAlmacen.create({ id_sede: sedeId, id_almacen: almacenId }),
    );
    return SedeAlmacenMapper.toResponseDto(
      saved,
      { id_sede: sede.id_sede, codigo: sede.codigo, nombre: sede.nombre },
      almacen,
    );
  }

  // ── NUEVO: reasigna aunque ya tenga sede ────────────────────────────────────
  async reassignWarehouseToSede(
    dto: AssignWarehouseToSedeDto,
  ): Promise<SedeAlmacenResponseDto> {
    const sedeId = Number(dto.id_sede);
    const almacenId = Number(dto.id_almacen);

    if (!sedeId || Number.isNaN(sedeId))
      throw new BadRequestException(
        'id_sede es obligatorio y debe ser numerico',
      );
    if (!almacenId || Number.isNaN(almacenId))
      throw new BadRequestException(
        'id_almacen es obligatorio y debe ser numerico',
      );

    const sede = await this.headquartersQuery.getHeadquarterById(sedeId);
    if (!sede) throw new NotFoundException(`Sede no encontrada: ${sedeId}`);
    if (sede.activo === false)
      throw new ConflictException('La sede esta inactiva');

    const almacen = await this.warehouseGateway.getWarehouseById(almacenId);
    if (!almacen)
      throw new NotFoundException(`Almacen no encontrado: ${almacenId}`);
    if (almacen.activo === false)
      throw new ConflictException('El almacen esta inactivo');

    // Borra la asignación anterior sin importar a qué sede estaba
    await this.repository.deleteByWarehouseId(almacenId);

    const saved = await this.repository.save(
      SedeAlmacen.create({ id_sede: sedeId, id_almacen: almacenId }),
    );
    return SedeAlmacenMapper.toResponseDto(
      saved,
      { id_sede: sede.id_sede, codigo: sede.codigo, nombre: sede.nombre },
      almacen,
    );
  }

  // ── NUEVO: desasigna el almacén de su sede ──────────────────────────────────
  async unassignWarehouse(id_almacen: number): Promise<void> {
    const existing = await this.repository.findByWarehouseId(id_almacen);
    if (!existing) {
      throw new NotFoundException(
        `El almacen ${id_almacen} no tiene sede asignada`,
      );
    }
    await this.repository.deleteByWarehouseId(id_almacen);
  }
}
