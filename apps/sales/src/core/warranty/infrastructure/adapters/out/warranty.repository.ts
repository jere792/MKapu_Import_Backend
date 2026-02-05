/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  FindWarrantyFilters,
  IWarrantyRepositoryPort,
} from '../../../domain/ports/out/warranty-ports-out';
import { InjectRepository } from '@nestjs/typeorm';
import { WarrantyOrmEntity } from '../../entity/warranty-orm-entity';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Warranty } from '../../../domain/entity/warranty-domain';
import { WarrantyMapper } from '../../../application/mapper/warranty.mapper';
import { WarrantyTrackingOrmEntity } from '../../entity/warranty-tracking-orm.entity';

@Injectable()
export class WarrantyRepository implements IWarrantyRepositoryPort {
  constructor(
    @InjectRepository(WarrantyOrmEntity)
    private readonly ormRepository: Repository<WarrantyOrmEntity>,
    @InjectRepository(WarrantyTrackingOrmEntity)
    private readonly trackingRepository: Repository<WarrantyTrackingOrmEntity>,
  ) {}
  async findByReceiptId(idComprobante: number): Promise<Warranty[]> {
    const results = await this.ormRepository.find({
      where: {
        comprobante: { id_comprobante: idComprobante },
      },
      relations: ['estado', 'details'],
      order: {
        fec_solicitud: 'DESC',
      },
    });

    return results.map((orm) => WarrantyMapper.toDomainEntity(orm));
  }
  async findAll(filters: FindWarrantyFilters): Promise<[Warranty[], number]> {
    const { page, limit, search, id_estado } = filters;
    const skip = (page - 1) * limit;
    const where:
      | FindOptionsWhere<WarrantyOrmEntity>
      | FindOptionsWhere<WarrantyOrmEntity>[] = {};

    if (id_estado) {
      where.estado = { id_estado: id_estado };
    }

    if (search) {
      const searchCondition = Like(`%${search}%`);

      Object.assign(where, [
        {
          num_garantia: searchCondition,
          ...(id_estado && { estado: { id_estado } }),
        },
        {
          prod_nombre: searchCondition,
          ...(id_estado && { estado: { id_estado } }),
        },
        {
          cod_prod: searchCondition,
          ...(id_estado && { estado: { id_estado } }),
        },
      ]);
    }

    const [resultOrm, total] = await this.ormRepository.findAndCount({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: ['estado', 'cliente'],
      order: {
        fec_solicitud: 'DESC',
      },
      take: limit,
      skip: skip,
    });

    const resultDomain = resultOrm.map((orm) =>
      WarrantyMapper.toDomainEntity(orm),
    );
    return [resultDomain, total];
  }

  async addTracking(tracking: any): Promise<void> {
    const trackOrm = new WarrantyTrackingOrmEntity();

    trackOrm.warranty = { id_garantia: tracking.id_garantia } as any;
    trackOrm.id_usuario_ref = tracking.id_usuario_ref;
    trackOrm.fecha = tracking.fecha || new Date();
    trackOrm.estado_anterior = tracking.estado_anterior;
    trackOrm.estado_nuevo = tracking.estado_nuevo;
    trackOrm.observacion = tracking.observacion;

    await this.trackingRepository.save(trackOrm);
  }
  async save(domainEntity: Warranty): Promise<Warranty> {
    const ormEntity = WarrantyMapper.toOrmEntity(domainEntity);
    const savedOrm = await this.ormRepository.save(ormEntity);
    return WarrantyMapper.toDomainEntity(savedOrm);
  }
  async update(domainEntity: Warranty): Promise<Warranty> {
    const ormEntity = WarrantyMapper.toOrmEntity(domainEntity);

    const savedOrm = await this.ormRepository.save(ormEntity);

    return this.findById(savedOrm.id_garantia);
  }
  async findById(id: number): Promise<Warranty | null> {
    const foundOrm = await this.ormRepository.findOne({
      where: { id_garantia: id },
      relations: ['estado', 'comprobante', 'cliente', 'details', 'tracking'],
      order: {
        tracking: {
          fecha: 'ASC',
        },
      },
    });

    if (!foundOrm) {
      return null;
    }

    return WarrantyMapper.toDomainEntity(foundOrm);
  }
  async delete(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }
}
