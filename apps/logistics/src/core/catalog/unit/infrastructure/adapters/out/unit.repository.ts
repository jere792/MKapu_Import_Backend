/* eslint-disable @typescript-eslint/no-unused-vars */
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { UnitPortsOut } from '../../../domain/port/out/unit-ports-out';
import { Unit, UnitStatus } from '../../../domain/entity/unit-domain-entity';
import { UnitOrmEntity } from '../../entity/unit-orm.entity';
import { MapperUnit } from '../../../application/mapper/mapper-unit';

export class UnitRepository implements UnitPortsOut {
  constructor(
    @InjectRepository(UnitOrmEntity)
    private readonly unitRepo: Repository<UnitOrmEntity>,
  ) {}

  async save(unit: Unit): Promise<Unit> {
    const entity = this.unitRepo.create({
      id_unidad: unit.id,
      id_producto: unit.productId,
      id_almacen: unit.warehouseId,
      serie: unit.serialNumber,
      fec_venc: unit.expirationDate,
      estado: unit.status,
    });
    const saved = await this.unitRepo.save(entity);
    return MapperUnit.toDomain(saved);
  }

  async findById(id: number): Promise<Unit | null> {
    const entity = await this.unitRepo.findOneBy({ id_unidad: id });
    return entity ? MapperUnit.toDomain(entity) : null;
  }

  findBySerial(serialNumber: string): Promise<Unit | null> {
    throw new Error('Method not implemented.');
  }

  findMany(filters: {
    productId?: number;
    warehouseId?: number;
    status?: UnitStatus;
  }): Promise<Unit[]> {
    throw new Error('Method not implemented.');
  }

  async findBySerials(
    serialNumbers: string[],
    manager?: EntityManager,
  ): Promise<Unit[]> {
    if (!serialNumbers.length) return [];

    const repository = manager?.getRepository(UnitOrmEntity) ?? this.unitRepo;
    const entities = await repository.find({
      where: {
        serie: In(serialNumbers),
      },
      relations: ['producto', 'almacen'],
    });
    return entities.map((entity) => MapperUnit.toDomain(entity));
  }

  updateStatus(id: number, status: UnitStatus): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateLocationAndStatusBySerial(
    serial: string,
    warehouseId: number,
    status: UnitStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager?.getRepository(UnitOrmEntity) ?? this.unitRepo;
    await repository.update(
      { serie: serial },
      {
        id_almacen: warehouseId,
        estado: status,
      },
    );
  }

  updateLocationAndStatus(
    id: number,
    warehouseId: number,
    status: UnitStatus,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateStatusBySerial(
    serial: string,
    status: UnitStatus,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager?.getRepository(UnitOrmEntity) ?? this.unitRepo;
    await repository.update({ serie: serial }, { estado: status });
  }

  async updateStatusBySerials(
    serials: string[],
    status: UnitStatus,
    manager?: EntityManager,
  ): Promise<void> {
    if (!serials.length) return;

    const repository = manager?.getRepository(UnitOrmEntity) ?? this.unitRepo;
    await repository.update({ serie: In(serials) }, { estado: status });
  }
}
