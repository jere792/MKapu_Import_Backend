/* eslint-disable @typescript-eslint/no-unused-vars */
import { In, Repository } from 'typeorm';
import { UnitPortsOut } from '../../../application/port/out/unit-ports-out';
import { Unit, UnitStatus } from '../../../domain/entity/unit-domain-intity';
import { UnitOrmEntity } from '../../entity/unit-orm.entity';
import { InjectRepository } from '@nestjs/typeorm';
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
  async findBySerials(serialNumbers: string[]): Promise<Unit[]> {
    if (!serialNumbers.length) return [];

    const entities = await this.unitRepo.find({
      where: {
        serie: In(serialNumbers),
      },
      relations: ['producto', 'almacen'],
    });
    console.log('--- REPO DEBUG ---');
    entities.forEach((e) => {
      console.log(`Serie: ${e.serie}`);
      console.log(`ID Almacén (columna):`, e.id_almacen); // ¿Es undefined?
      console.log(`Objeto Almacén:`, e.almacen); // ¿Existe?
      console.log(
        `ID Almacén (dentro del objeto):`,
        e.almacen?.id_almacen || e.almacen?.id_almacen,
      );
    });
    return entities.map((e) => MapperUnit.toDomain(e));
  }
  updateStatus(id: number, status: UnitStatus): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async updateLocationAndStatusBySerial(
    serial: string,
    warehouseId: number,
    status: UnitStatus,
  ): Promise<void> {
    await this.unitRepo.update(
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
  ): Promise<void> {
    await this.unitRepo.update({ serie: serial }, { estado: status });
  }
}
