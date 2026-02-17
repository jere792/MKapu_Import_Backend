/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { TransferPortsOut } from '../../../../domain/ports/out/transfer-ports-out';
import {
  Transfer,
  TransferStatus,
} from '../../../../domain/entity/transfer-domain-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TransferDetailOrmEntity } from '../../../entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from '../../../entity/transfer-orm.entity';
import { TransferMapper } from '../../../../application/mapper/transfer-mapper';
import { StockOrmEntity } from '../../../../../inventory/infrastructure/entity/stock-orm-intity';

@Injectable()
export class TransferRepository implements TransferPortsOut {
  constructor(
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
    @InjectRepository(TransferDetailOrmEntity)
    private readonly detailRepo: Repository<TransferDetailOrmEntity>,
    private readonly dataSource: DataSource,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>
  ) {}
  async save(transfer: Transfer): Promise<Transfer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entity = this.transferRepo.create({
        id: transfer.id,
        originWarehouseId: transfer.originWarehouseId,
        destinationWarehouseId: transfer.destinationWarehouseId,
        date: transfer.requestDate,
        status: transfer.status,
        motive: transfer.observation,
        operationType: 'TRANSFERENCIA',
      });
      const savedEntity = await queryRunner.manager.save(entity);
      if (!transfer.id) {
        const detailEntities: TransferDetailOrmEntity[] = [];

        for (const item of transfer.items) {
          for (const serie of item.series) {
            const detail = this.detailRepo.create({
              transferId: savedEntity.id,
              productId: item.productId,
              serialNumber: serie,
              quantity: 1,
            });
            detailEntities.push(detail);
          }
        }
        await queryRunner.manager.save(detailEntities);
      }
      await queryRunner.commitTransaction();
      transfer.id = savedEntity.id;
      return transfer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findById(id: number): Promise<Transfer | null> {
    const entity = await this.transferRepo.findOne({where: {id}, relations:['details']});
    if (!entity) return null;
    //Origen
    const originHq = await this.getHeadquartersByWarehouse(entity.originWarehouseId);
    //Destino
    const destHq = await this.getHeadquartersByWarehouse(entity.destinationWarehouseId);
    return TransferMapper.mapToDomain(entity, originHq, destHq);
  }
  async updateStatus(
    id: number,
    status: TransferStatus,
  ): Promise<void> {
    await this.transferRepo.update(id, { status });
  }
  async findByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    const warehouses = await this.stockRepo
      .createQueryBuilder('stock')
      .select('DISTINCT stock.id_almacen', 'id')
      .where('stock.id_sede = :hqId', { hqId: headquartersId })
      .getRawMany();
      const warehouseIds = warehouses.map((w) => w.id);
      if (warehouseIds.length === 0) return [];
      const entities = await this.transferRepo.find({
        where: [
          { originWarehouseId: In(warehouseIds) },
          { destinationWarehouseId: In(warehouseIds) },
        ],
        relations: ['details'],
        order: { date: 'DESC' },
      });
    return Promise.all(entities.map(async e => {
       // Para ser precisos, resolvemos ambos lados
       const originHq = await this.getHeadquartersByWarehouse(e.originWarehouseId);
       const destHq = await this.getHeadquartersByWarehouse(e.destinationWarehouseId);
       return TransferMapper.mapToDomain(e, originHq, destHq);
    }));
  }
  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferRepo.find({
      relations: ['details'],
      order: { date: 'DESC' },
    });
    return Promise.all(entities.map(async e => {
      const originHq = await this.getHeadquartersByWarehouse(e.originWarehouseId);
      const destHq = await this.getHeadquartersByWarehouse(e.destinationWarehouseId);
      return TransferMapper.mapToDomain(e, originHq, destHq);
    }));
  }
  private async getHeadquartersByWarehouse(warehouseId: number): Promise<string> {
    const stock = await this.stockRepo.findOne({
      where: { id_almacen: warehouseId },
      select: ['id_sede'],
    });
    return stock ? stock.id_sede : 'SIN-SEDE';
  }
}
