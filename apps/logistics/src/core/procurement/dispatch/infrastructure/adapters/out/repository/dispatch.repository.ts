import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDispatchOutputPort } from '../../../../domain/ports/out/dispatch-output.port';
import { Dispatch } from '../../../../domain/entity/dispatch-domain-entity';
import { DispatchDetail } from '../../../../domain/entity/dispatch-detail-domain-entity';
import { DispatchMapper } from '../../../../application/mapper/dispatch.mapper';
import { DispatchOrmEntity } from '../../../entity/dispatch-orm.entity';
import { DispatchDetailOrmEntity } from '../../../entity/dispatch-detail-orm.entity';

@Injectable()
export class DispatchRepository implements IDispatchOutputPort {
  constructor(
    @InjectRepository(DispatchOrmEntity)
    private readonly dispatchRepo: Repository<DispatchOrmEntity>,
    @InjectRepository(DispatchDetailOrmEntity)
    private readonly detailRepo: Repository<DispatchDetailOrmEntity>,
  ) {}

  async findById(id_despacho: number): Promise<Dispatch | null> {
    const orm = await this.dispatchRepo.findOne({
      where: { id_despacho },
      relations: ['detalles'],
    });
    if (!orm) return null;
    const detalles = (orm.detalles ?? []).map(DispatchMapper.detailToDomain);
    return DispatchMapper.toDomain(orm, detalles);
  }

  async findDetailById(id_detalle_despacho: number): Promise<DispatchDetail | null> {
    const orm = await this.detailRepo.findOne({ where: { id_detalle_despacho } });
    if (!orm) return null;
    return DispatchMapper.detailToDomain(orm);
  }

  async findAll(): Promise<Dispatch[]> {
    const orms = await this.dispatchRepo.find({ relations: ['detalles'] });
    return orms.map(orm => {
      const detalles = (orm.detalles ?? []).map(DispatchMapper.detailToDomain);
      return DispatchMapper.toDomain(orm, detalles);
    });
  }

  async findByVenta(id_venta_ref: number): Promise<Dispatch[]> {
    const orms = await this.dispatchRepo.find({
      where: { id_venta_ref },
      relations: ['detalles'],
    });
    return orms.map(orm => {
      const detalles = (orm.detalles ?? []).map(DispatchMapper.detailToDomain);
      return DispatchMapper.toDomain(orm, detalles);
    });
  }

  async save(dispatch: Dispatch): Promise<Dispatch> {
    const orm = DispatchMapper.toOrm(dispatch);
    const saved = await this.dispatchRepo.save(orm);
    const detalles = await Promise.all(
      dispatch.detalles.map(d => {
        const detailOrm = DispatchMapper.detailToOrm(d, saved.id_despacho);
        return this.detailRepo.save(detailOrm);
      }),
    );
    const domainDetalles = detalles.map(DispatchMapper.detailToDomain);
    return DispatchMapper.toDomain(saved, domainDetalles);
  }

  async saveDetail(detail: DispatchDetail, id_despacho: number): Promise<DispatchDetail> {
    const orm = DispatchMapper.detailToOrm(detail, id_despacho);
    const saved = await this.detailRepo.save(orm);
    return DispatchMapper.detailToDomain(saved);
  }

  async update(dispatch: Dispatch): Promise<Dispatch> {
    const orm = DispatchMapper.toOrm(dispatch);
    await this.dispatchRepo.save(orm);
    return this.findById(dispatch.id_despacho!) as Promise<Dispatch>;
  }

  async updateDetail(detail: DispatchDetail): Promise<DispatchDetail> {
    const orm = await this.detailRepo.findOne({
      where: { id_detalle_despacho: detail.id_detalle_despacho! },
    });
    if (!orm) throw new Error(`Detalle ${detail.id_detalle_despacho} no encontrado`);
    orm.cantidad_despachada = detail.cantidad_despachada;
    orm.estado = detail.estado;
    const saved = await this.detailRepo.save(orm);
    return DispatchMapper.detailToDomain(saved);
  }
}