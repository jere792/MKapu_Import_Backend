import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IWastageRepositoryPort } from '../../../../domain/ports/out/wastage.port.out';
import {
  Wastage,
  WastageDetail,
} from '../../../../domain/entity/wastage-domain-intity';
import { WastageOrmEntity } from '../../../entity/wastage-orm.entity';
import { WastageDetailOrmEntity } from '../../../entity/wastage-detail.orm.entity';
import { UsuarioTcpProxy } from '../../out/TCP/usuario-tcp.proxy';

@Injectable()
export class WastageTypeOrmRepository implements IWastageRepositoryPort {
  constructor(
    @InjectRepository(WastageOrmEntity)
    private readonly typeOrmRepository: Repository<WastageOrmEntity>,
    private readonly usuarioTcpProxy: UsuarioTcpProxy,
  ) {}

  async save(domain: Wastage): Promise<Wastage> {
    const ormEntity = this.toOrmEntity(domain);
    const savedOrm = await this.typeOrmRepository.save(ormEntity);

    const reloaded = await this.typeOrmRepository.findOne({
      where: { id_merma: savedOrm.id_merma },
      relations: ['detalles', 'tipoMerma'],
    });

    const domainSaved = reloaded
      ? this.toDomainEntity(reloaded)
      : this.toDomainEntity(savedOrm);

    try {
      const resp = await this.usuarioTcpProxy.getUserById(
        domainSaved.id_usuario_ref,
      );
      (domainSaved as any).responsable = resp?.nombreCompleto ?? undefined;
    } catch {
      (domainSaved as any).responsable = undefined;
    }

    return domainSaved;
  }

  async update(
    id: number,
    payload: { motivo?: string; id_tipo_merma?: number },
  ): Promise<Wastage> {
    const qb = this.typeOrmRepository
      .createQueryBuilder()
      .update(WastageOrmEntity)
      .where('id_merma = :id', { id });

    const fieldsToUpdate: Record<string, any> = {};
    if (payload.motivo !== undefined) fieldsToUpdate['motivo'] = payload.motivo;
    if (payload.id_tipo_merma !== undefined)
      fieldsToUpdate['id_tipo_merma'] = payload.id_tipo_merma;
    if (Object.keys(fieldsToUpdate).length === 0)
      throw new Error('No hay campos para actualizar.');

    await qb.set(fieldsToUpdate).execute();

    const reloaded = await this.typeOrmRepository.findOne({
      where: { id_merma: id },
      relations: ['detalles', 'tipoMerma'],
    });
    if (!reloaded)
      throw new Error(`Merma #${id} no encontrada tras actualizar`);

    const domain = this.toDomainEntity(reloaded);
    try {
      const u = await this.usuarioTcpProxy.getUserById(domain.id_usuario_ref);
      (domain as any).responsable = u?.nombreCompleto ?? undefined;
    } catch {
      (domain as any).responsable = undefined;
    }

    return domain;
  }

  async findById(id: number): Promise<Wastage | null> {
    const orm = await this.typeOrmRepository.findOne({
      where: { id_merma: id },
      relations: ['detalles', 'tipoMerma'],
    });
    if (!orm) return null;

    const domain = this.toDomainEntity(orm);
    try {
      if (domain.id_usuario_ref) {
        const u = await this.usuarioTcpProxy.getUserById(domain.id_usuario_ref);
        (domain as any).responsable = u?.nombreCompleto ?? undefined;
      }
    } catch {
      (domain as any).responsable = undefined;
    }

    return domain;
  }

  async findAll(): Promise<Wastage[]> {
    const orms = await this.typeOrmRepository.find({
      relations: ['detalles', 'tipoMerma'],
      order: { fec_merma: 'DESC' },
    });
    const domains = orms.map((orm) => this.toDomainEntity(orm));
    await this.attachResponsablesBatch(domains);
    return domains;
  }

  async findAndCount(
    skip: number,
    take: number,
    id_sede?: number,
  ): Promise<[Wastage[], number]> {
    const where = id_sede ? { id_sede_ref: id_sede } : {};
    const [orms, total] = await this.typeOrmRepository.findAndCount({
      where,
      relations: ['detalles', 'tipoMerma'],
      order: { fec_merma: 'DESC' },
      skip,
      take,
    });
    const domains = orms.map((orm) => this.toDomainEntity(orm));
    await this.attachResponsablesBatch(domains);
    return [domains, total];
  }

  async searchSuggestions(
    q: string,
    id_sede?: number,
    limit = 8,
  ): Promise<Wastage[]> {
    const qb = this.typeOrmRepository
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.tipoMerma', 'tm')
      .leftJoinAndSelect('w.detalles', 'd')
      .where(
        `(
        w.motivo          LIKE :q OR
        CAST(w.id_merma AS CHAR) LIKE :q OR
        tm.tipo           LIKE :q OR
        d.cod_prod        LIKE :q OR
        d.desc_prod       LIKE :q
      )`,
        { q: `%${q}%` },
      )
      .orderBy('w.fec_merma', 'DESC')
      .take(limit);

    if (id_sede) qb.andWhere('w.id_sede_ref = :id_sede', { id_sede });

    const orms = await qb.getMany();

    const conteoPorId = new Map<number, number>(
      orms.map((o) => [o.id_merma, o.detalles?.length ?? 0]),
    );

    const domains = orms.map((orm) => {
      const d = this.toDomainEntity(orm);
      (d as any).total_items = conteoPorId.get(orm.id_merma) ?? 0;
      return d;
    });

    await this.attachResponsablesBatch(domains);
    return domains;
  }
  /* ── Mapping ─────────────────────────────────────────────────────────── */

  private toOrmEntity(domain: Wastage): WastageOrmEntity {
    const orm = new WastageOrmEntity();
    if (domain.id_merma) orm.id_merma = domain.id_merma;
    orm.id_usuario_ref = domain.id_usuario_ref;
    orm.id_sede_ref = domain.id_sede_ref;
    orm.id_almacen_ref = domain.id_almacen_ref;
    orm.motivo = domain.motivo;
    orm.fec_merma = domain.fec_merma;
    orm.estado = domain.estado;
    if ((domain as any).tipo_merma_id)
      orm.id_tipo_merma = (domain as any).tipo_merma_id;

    orm.detalles = (domain.detalles || []).map((d) => {
      const dOrm = new WastageDetailOrmEntity();
      if (d.id_detalle) dOrm.id_detalle = d.id_detalle;
      dOrm.id_producto = d.id_producto;
      dOrm.cod_prod = d.cod_prod;
      dOrm.desc_prod = d.desc_prod;
      dOrm.cantidad = d.cantidad;
      dOrm.pre_unit = d.pre_unit;
      dOrm.id_tipo_merma = (d as any).id_tipo_merma ?? undefined;
      dOrm.observacion = d.observacion ?? null;
      dOrm.id_merma = domain.id_merma ?? (undefined as any);
      return dOrm;
    });

    return orm;
  }

  private toDomainEntity(orm: WastageOrmEntity): Wastage {
    const detallesDomain: WastageDetail[] = (orm.detalles || []).map(
      (d) =>
        new WastageDetail(
          d.id_detalle,
          d.id_producto,
          d.cod_prod,
          d.desc_prod,
          d.cantidad,
          Number(d.pre_unit),
          d.id_tipo_merma,
          d.observacion,
        ),
    );

    const domain = new Wastage(
      orm.id_merma,
      orm.id_usuario_ref,
      orm.id_sede_ref,
      orm.id_almacen_ref,
      orm.motivo,
      orm.fec_merma,
      orm.estado,
      detallesDomain,
    );

    (domain as any).tipo_merma_id = orm.id_tipo_merma ?? null;
    (domain as any).tipo_merma_label = orm.tipoMerma?.tipo ?? null;
    (domain as any).responsable = undefined;

    return domain;
  }

  private async attachResponsablesBatch(domains: Wastage[]) {
    const userIds = Array.from(
      new Set(domains.map((d) => d.id_usuario_ref).filter(Boolean)),
    ) as number[];

    if (userIds.length === 0) {
      domains.forEach((d) => ((d as any).responsable = undefined));
      return;
    }

    try {
      const users = await this.usuarioTcpProxy.getUsersByIds(userIds);
      const userMap = new Map<number, string>(
        users.map((u) => [u.id_usuario, u.nombreCompleto]),
      );
      domains.forEach((d) => {
        (d as any).responsable = userMap.get(d.id_usuario_ref) ?? undefined;
      });
    } catch {
      domains.forEach((d) => ((d as any).responsable = undefined));
    }
  }
}
