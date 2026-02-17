import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IAuctionRepositoryPort } from '../../../../domain/port/out/auction.port.out';
import { Auction } from '../../../../domain/entity/auction-domain-entity';
import { ListAuctionFilterDto } from '../../../../application/dto/in/list-auction-filter.dto';
import { AuctionOrmEntity } from '../../../entity/auction-orm.entity';
import { AuctionDetailOrmEntity } from '../../../entity/auction-detail.orm.entity';

/**
 * TypeORM implementation of IAuctionRepositoryPort.
 *
 * Ajusta los paths de import a tu estructura real si hiciera falta.
 */
@Injectable()
export class AuctionTypeormRepository implements IAuctionRepositoryPort {
  private readonly logger = new Logger(AuctionTypeormRepository.name);

  constructor(
    @InjectRepository(AuctionOrmEntity)
    private readonly auctionRepo: Repository<AuctionOrmEntity>,
    // opcional: inyectar DataSource si necesitas queries más complejas
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------
  // Helpers: mapping orm <-> domain
  // -------------------------
  private toDomain(orm: AuctionOrmEntity): Auction {
    const details = (orm.detalles || []).map((d: AuctionDetailOrmEntity) => ({
      id_detalle_remate: d.id_detalle_remate,
      productId: d.id_producto,
      originalPrice: Number(d.pre_original),
      auctionPrice: Number(d.pre_remate),
      auctionStock: Number(d.stock_remate),
      observacion: (d as any).observacion ?? undefined,
      // keep orm fields for reference if needed: id_remate: d.id_remate
    }));

    const domain = new Auction(
      orm.cod_remate,
      orm.descripcion,
      new Date(orm.fec_fin),
      new Date(orm.fec_inicio),
      orm.estado as any,
      orm.id_remate,
      details.map((d) => ({
        id_detalle_remate: d.id_detalle_remate,
        productId: d.productId,
        originalPrice: d.originalPrice,
        auctionPrice: d.auctionPrice,
        auctionStock: d.auctionStock,
        observacion: d.observacion,
      })),
    );

    return domain;
  }

  private async mapDomainToOrm(domain: Auction, existing?: AuctionOrmEntity): Promise<AuctionOrmEntity> {
    const orm = existing ?? new AuctionOrmEntity();

    orm.cod_remate = domain.code;
    orm.descripcion = domain.description;
    orm.fec_inicio = domain.startAt;
    orm.fec_fin = domain.endAt;
    orm.estado = domain.status as any;

    // Map details: create new detail OR update id if provided.
    orm.detalles = (domain.details || []).map((d) => {
      const detOrm = new AuctionDetailOrmEntity();
      if ((d as any).id_detalle_remate) {
        detOrm.id_detalle_remate = (d as any).id_detalle_remate;
      }
      detOrm.pre_original = d.originalPrice;
      detOrm.pre_remate = d.auctionPrice;
      detOrm.stock_remate = d.auctionStock;
      detOrm.id_producto = d.productId;
      // id_remate will be assigned by relation when saving if orm.id_remate exists or after save
      return detOrm;
    });

    return orm;
  }

  // -------------------------
  // Port methods
  // -------------------------
  async save(domain: Auction): Promise<Auction> {
    // If updating existing auction, fetch with details first
    let orm: AuctionOrmEntity | null = null;
    if (domain.id) {
      orm = await this.auctionRepo.findOne({
        where: { id_remate: domain.id },
        relations: ['detalles'],
      });
    }

    orm = await this.mapDomainToOrm(domain, orm ?? undefined);

    // If there was an existing ORM entity and we replaced detalles, we should preserve FK id_remate on details
    // but TypeORM will handle through relation. To be safe, set id_remate on detail rows when updating existing record:
    if (domain.id) {
      // ensure existing id present so details persist correctly
      orm.id_remate = domain.id;
      orm.detalles.forEach((d) => {
        (d as any).id_remate = domain.id;
      });
    }

    // Persist via repository. cascade:true on OneToMany will save details.
    const savedOrm = await this.auctionRepo.save(orm);

    // Reload with details to ensure we have generated ids
    const reloaded = await this.auctionRepo.findOne({
      where: { id_remate: savedOrm.id_remate },
      relations: ['detalles'],
    });

    if (!reloaded) {
      this.logger.warn('Saved auction but could not reload entity.');
      return this.toDomain(savedOrm);
    }

    return this.toDomain(reloaded);
  }

  async findById(id: number): Promise<Auction | null> {
    const orm = await this.auctionRepo.findOne({
      where: { id_remate: id },
      relations: ['detalles'],
    });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findPaged(filters: ListAuctionFilterDto): Promise<{ items: Auction[]; total: number }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const skip = (page - 1) * limit;

    // Build query
    const qb = this.auctionRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.detalles', 'd');

    // search in code or descripcion
    if (filters.search) {
      qb.andWhere('(r.cod_remate LIKE :search OR r.descripcion LIKE :search)', { search: `%${filters.search}%` });
    }

    if (filters.estado) {
      qb.andWhere('r.estado = :estado', { estado: filters.estado });
    }

    if (filters.startDate) {
      qb.andWhere('r.fec_inicio >= :start', { start: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere('r.fec_fin <= :end', { end: filters.endDate });
    }

    // sorting
    let orderField = 'r.fec_inicio';
    let orderDir: 'ASC' | 'DESC' = 'DESC';
    if (filters.sort) {
      const [field, dir] = filters.sort.split(':');
      const mapped = {
        cod_remate: 'r.cod_remate',
        fec_inicio: 'r.fec_inicio',
        fec_fin: 'r.fec_fin',
      } as Record<string, string>;
      if (mapped[field]) orderField = mapped[field];
      orderDir = dir && dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    }
    qb.orderBy(orderField, orderDir);

    qb.skip(skip).take(limit);

    const [ormItems, total] = await qb.getManyAndCount();

    const items = ormItems.map((o) => this.toDomain(o));

    return { items, total };
  }

  async delete(id: number): Promise<void> {
    await this.auctionRepo.delete({ id_remate: id });
  }
}