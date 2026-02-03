/* ============================================
   administration/src/core/cashbox/infrastructure/adapters/out/cashbox-typeorm.repository.ts
   ============================================ */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICashboxRepositoryPort } from '../../../../domain/ports/out/cashbox-ports-out';
import { CashboxOrmEntity } from '../../../entity/cashbox-orm.entity';
import { Cashbox } from '../../../../domain/entity/cashbox-domain-entity';

/* administration/src/core/cashbox/infrastructure/adapters/out/cashbox-typeorm.repository.ts */

@Injectable()
export class CashboxTypeOrmRepository implements ICashboxRepositoryPort {
  constructor(
    @InjectRepository(CashboxOrmEntity)
    private readonly repository: Repository<CashboxOrmEntity>,
  ) {}

  // Función privada para no repetir código de conversión
  private mapToDomain(orm: CashboxOrmEntity): Cashbox {
    return new Cashbox(
      orm.id_caja,
      orm.id_sede_ref,
      orm.estado as any, // Cast para coincidir con el literal string del dominio
      orm.fec_apertura,
      orm.fec_cierre // Asegúrate que en la entidad ORM este campo mapee a 'fec_cierre'
    );
  }

  async save(cashbox: Cashbox): Promise<Cashbox> {
    const ormEntity = this.repository.create({
      id_caja: cashbox.id_caja,
      id_sede_ref: cashbox.id_sede_ref,
      estado: cashbox.estado,
      fec_apertura: cashbox.fec_apertura,
      fec_cierre: cashbox.fec_cierre,
    });
    const saved = await this.repository.save(ormEntity);
    return this.mapToDomain(saved);
  }

  async update(cashbox: Cashbox): Promise<Cashbox> {
    await this.repository.update(cashbox.id_caja, {
      estado: cashbox.estado,
      fec_cierre: cashbox.fec_cierre, // Usando el nombre de propiedad del ORM
    });
    return cashbox;
  }

  async findById(id_caja: string): Promise<Cashbox | null> {
    const orm = await this.repository.findOne({ where: { id_caja } });
    return orm ? this.mapToDomain(orm) : null;
  }

  async findActiveBySede(id_sede_ref: number): Promise<Cashbox | null> {
    const orm = await this.repository.findOne({
      where: { id_sede_ref, estado: 'ABIERTA' as any },
    });
    return orm ? this.mapToDomain(orm) : null;
  }

  async existsActiveInSede(id_sede_ref: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { id_sede_ref, estado: 'ABIERTA' as any },
    });
    return count > 0;
  }
}