// infrastructure/adapters/out/repository/terminos-condiciones.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TerminosCondicionesRepositoryPort,
} from '../../../../domain/ports/out/terminos-condiciones.repository.port';
import { TerminosCondicionesDomain, TerminosSeccionDomain,
         TerminosParrafoDomain, TerminosItemDomain,
} from '../../../../domain/entity/terminos-condiciones.domain';
import { TerminosCondicionesEntity } from '../../../entity/terms-conditions.entity';
import { TerminosItemEntity } from '../../../entity/terms-item.entity';
import { TerminosParrafoEntity } from '../../../entity/terms-paragraph.entity';
import { TerminosSeccionEntity } from '../../../entity/terms-section.entity';

@Injectable()
export class TerminosCondicionesRepository implements TerminosCondicionesRepositoryPort {

  constructor(
    @InjectRepository(TerminosCondicionesEntity)
    private readonly repo: Repository<TerminosCondicionesEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── helpers ────────────────────────────────────────────────────
  private toDomain(e: TerminosCondicionesEntity): TerminosCondicionesDomain {
    return new TerminosCondicionesDomain(
      e.id, e.version, e.fechaVigencia, e.activo,
      e.creadoPor?.id_cuenta,
      e.creadoEn, e.actualizadoEn,
      (e.secciones ?? []).map(s => new TerminosSeccionDomain(
        s.id, s.numero, s.titulo, s.orden,
        (s.parrafos ?? []).map(p => new TerminosParrafoDomain(p.id, p.contenido, p.orden)),
        (s.items    ?? []).map(i => new TerminosItemDomain(i.id, i.contenido, i.orden)),
      )),
    );
  }

  private toEntity(d: TerminosCondicionesDomain): TerminosCondicionesEntity {
    const e        = new TerminosCondicionesEntity();
    e.version      = d.version;
    e.fechaVigencia = d.fechaVigencia;
    e.activo       = d.activo;
    if (d.creadoPor) { e.creadoPor = { id_cuenta: d.creadoPor } as any; }
    e.secciones    = (d.secciones ?? []).map(s => {
      const sec    = new TerminosSeccionEntity();
      sec.numero   = s.numero;
      sec.titulo   = s.titulo;
      sec.orden    = s.orden;
      sec.parrafos = s.parrafos.map(p => {
        const par      = new TerminosParrafoEntity();
        par.contenido  = p.contenido;
        par.orden      = p.orden;
        return par;
      });
      sec.items = s.items.map(i => {
        const item     = new TerminosItemEntity();
        item.contenido = i.contenido;
        item.orden     = i.orden;
        return item;
      });
      return sec;
    });
    return e;
  }

  private relations = {
    secciones: { parrafos: true, items: true },
  };

  // ── queries ────────────────────────────────────────────────────
  async findActivo(): Promise<TerminosCondicionesDomain | null> {
    const e = await this.repo.findOne({
      where: { activo: true },
      relations: this.relations,
    });
    return e ? this.toDomain(e) : null;
  }

  async findAll(): Promise<TerminosCondicionesDomain[]> {
    const list = await this.repo.find({
      relations: this.relations,
      order: { creadoEn: 'DESC' },
    });
    return list.map(e => this.toDomain(e));
  }

  async findById(id: number): Promise<TerminosCondicionesDomain | null> {
    const e = await this.repo.findOne({
      where: { id },
      relations: this.relations,
    });
    return e ? this.toDomain(e) : null;
  }

  // ── commands ───────────────────────────────────────────────────
  async save(domain: TerminosCondicionesDomain): Promise<TerminosCondicionesDomain> {
    const entity = this.toEntity(domain);
    const saved  = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: number, domain: TerminosCondicionesDomain): Promise<TerminosCondicionesDomain> {
    const entity  = this.toEntity(domain);
    entity.id     = id;
    const updated = await this.repo.save(entity);
    return this.toDomain(updated);
  }

  async activar(id: number): Promise<void> {
    // Desactiva todas y activa solo la seleccionada en una transacción
    await this.dataSource.transaction(async (manager) => {
      await manager.update(TerminosCondicionesEntity, {}, { activo: false });
      await manager.update(TerminosCondicionesEntity, { id }, { activo: true });
    });
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}