import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConteoInventarioDetalleOrmEntity } from '../../../entity/inventory-count-detail-orm.entity';
import { ConteoInventarioOrmEntity } from '../../../entity/inventory-count-orm.entity';
import { StockOrmEntity } from '../../../entity/stock-orm-entity';
import { IInventoryCountRepository } from '../../../../domain/ports/out/inventory-count-port-out';

@Injectable()
export class InventoryCountRepository implements IInventoryCountRepository {
  constructor(
    @InjectRepository(ConteoInventarioOrmEntity)
    private readonly headerRepo: Repository<ConteoInventarioOrmEntity>,
    @InjectRepository(ConteoInventarioDetalleOrmEntity)
    private readonly detailRepo: Repository<ConteoInventarioDetalleOrmEntity>,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
  ) {}

  async findHeaderById(idConteo: number) {
    return await this.headerRepo.findOne({
      where: { idConteo },
      relations: ['detalles'],
    });
  }

  async listAllHeadersBySede(codSede?: string) {
    const query = this.headerRepo
      .createQueryBuilder('conteo')
      .leftJoinAndSelect('conteo.detalles', 'detalles')
      .orderBy('conteo.fechaIni', 'DESC');

    if (
      codSede &&
      codSede !== '' &&
      codSede !== 'null' &&
      codSede !== 'undefined'
    ) {
      query.andWhere('conteo.codSede = :codSede', { codSede });
    }

    return await query.getMany();
  }

  async findDetailById(idDetalle: number) {
    return await this.detailRepo.findOne({
      where: { idDetalle },
    });
  }
  async obtenerStockParaSnapshot(
    idSede: string,
    idCategoria?: number,
    manager?: EntityManager,
  ): Promise<StockOrmEntity[]> {
    const repo = manager
      ? manager.getRepository(StockOrmEntity)
      : this.stockRepo;

    const query = repo
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.producto', 'producto')
      .where('stock.id_sede = :idSede', { idSede });

    if (idCategoria) {
      query.andWhere('producto.idCategoria = :idCategoria', { idCategoria });
    }
    return await query.getMany();
  }
  async obtenerConteoParaReporte(
    idConteo: number,
  ): Promise<ConteoInventarioOrmEntity> {
    const conteo = await this.headerRepo.findOne({
      where: { idConteo },
      relations: ['detalles'],
    });

    if (!conteo) throw new Error('El conteo solicitado no existe');
    return conteo;
  }
}
