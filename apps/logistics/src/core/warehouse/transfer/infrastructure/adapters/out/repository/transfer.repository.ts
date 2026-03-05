import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  Transfer,
  TransferMode,
  TransferStatus,
} from '../../../../domain/entity/transfer-domain-entity';
import { TransferPortsOut } from '../../../../domain/ports/out/transfer-ports-out';
import { TransferMapper } from '../../../../application/mapper/transfer-mapper';
import { StockOrmEntity } from '../../../../../inventory/infrastructure/entity/stock-orm-entity';
import { TransferDetailOrmEntity } from '../../../entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from '../../../entity/transfer-orm.entity';

@Injectable()
export class TransferRepository implements TransferPortsOut {
  constructor(
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async save(transfer: Transfer, manager?: EntityManager): Promise<Transfer> {
    const entityManager = manager ?? this.dataSource.manager;
    const transferRepository = entityManager.getRepository(TransferOrmEntity);
    const detailRepository = entityManager.getRepository(TransferDetailOrmEntity);

    if (transfer.id) {
      await transferRepository.update(transfer.id, {
        status: transfer.status,
        motive: transfer.observation ?? null,
        userIdRefDest: transfer.approveUserId ?? null,
      });
      return transfer;
    }

    const entity = transferRepository.create({
      originWarehouseId: transfer.originWarehouseId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      date: transfer.requestDate,
      status: transfer.status,
      motive: transfer.observation,
      operationType:
        transfer.mode === TransferMode.AGGREGATED
          ? 'TRANSFERENCIA_AGGREGATED'
          : 'TRANSFERENCIA',
      userIdRefOrigin: transfer.creatorUserId ?? 0,
      userIdRefDest: null,
    });

    const savedEntity = await transferRepository.save(entity);

    const detailEntities: TransferDetailOrmEntity[] = [];
    for (const item of transfer.items) {
      if (transfer.mode === TransferMode.AGGREGATED) {
        detailEntities.push(
          detailRepository.create({
            transferId: savedEntity.id,
            productId: item.productId,
            serialNumber: `QTY-${randomUUID()}`,
            quantity: item.quantity,
          }),
        );
        continue;
      }

      for (const serie of item.series) {
        detailEntities.push(
          detailRepository.create({
            transferId: savedEntity.id,
            productId: item.productId,
            serialNumber: serie,
            quantity: 1,
          }),
        );
      }
    }

    if (detailEntities.length > 0) {
      await detailRepository.save(detailEntities);
    }

    transfer.id = savedEntity.id;
    return transfer;
  }

  async findById(id: number): Promise<Transfer | null> {
    const entity = await this.transferRepo.findOne({
      where: { id },
      relations: ['details'],
    });
    if (!entity) {
      return null;
    }

    const headquartersMap = await this.resolveHeadquartersMap([
      entity.originWarehouseId,
      entity.destinationWarehouseId,
    ]);

    return TransferMapper.mapToDomain(
      entity,
      headquartersMap.get(entity.originWarehouseId) ?? 'SIN-SEDE',
      headquartersMap.get(entity.destinationWarehouseId) ?? 'SIN-SEDE',
    );
  }

  async updateStatus(id: number, status: TransferStatus): Promise<void> {
    await this.transferRepo.update(id, { status });
  }

  async findByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    const warehouseIds = await this.findWarehouseIdsByHeadquarters(headquartersId);
    if (warehouseIds.length === 0) {
      return [];
    }

    const entities = await this.transferRepo.find({
      where: [
        { originWarehouseId: In(warehouseIds) },
        { destinationWarehouseId: In(warehouseIds) },
      ],
      relations: ['details'],
      order: { date: 'DESC' },
    });

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferRepo.find({
      relations: ['details'],
      order: { date: 'DESC' },
    });
    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findAllPaginated(
    page: number,
    pageSize: number,
    headquartersId: string,
  ): Promise<{ transfers: Transfer[]; total: number }> {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

    const query = this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.details', 'detail')
      .orderBy('transfer.date', 'DESC');

    if (String(headquartersId ?? '').trim()) {
      const warehouseIds = await this.findWarehouseIdsByHeadquarters(headquartersId);
      if (warehouseIds.length === 0) {
        return { transfers: [], total: 0 };
      }
      this.applyHeadquartersFilter(query, warehouseIds);
    }

    query.skip((safePage - 1) * safePageSize).take(safePageSize);

    const [entities, total] = await query.getManyAndCount();
    const transfers = await this.mapEntitiesWithHeadquarters(entities);
    return { transfers, total };
  }

  private applyHeadquartersFilter(
    query: SelectQueryBuilder<TransferOrmEntity>,
    warehouseIds: number[],
  ): void {
    query.andWhere(
      '(transfer.originWarehouseId IN (:...warehouseIds) OR transfer.destinationWarehouseId IN (:...warehouseIds))',
      { warehouseIds },
    );
  }

  private async mapEntitiesWithHeadquarters(
    entities: TransferOrmEntity[],
  ): Promise<Transfer[]> {
    if (entities.length === 0) {
      return [];
    }

    const warehouseIds = Array.from(
      new Set(
        entities.flatMap((entity) => [
          entity.originWarehouseId,
          entity.destinationWarehouseId,
        ]),
      ),
    );
    const headquartersMap = await this.resolveHeadquartersMap(warehouseIds);

    return entities.map((entity) =>
      TransferMapper.mapToDomain(
        entity,
        headquartersMap.get(entity.originWarehouseId) ?? 'SIN-SEDE',
        headquartersMap.get(entity.destinationWarehouseId) ?? 'SIN-SEDE',
      ),
    );
  }

  private async findWarehouseIdsByHeadquarters(
    headquartersId: string,
  ): Promise<number[]> {
    const rows = await this.stockRepo
      .createQueryBuilder('stock')
      .select('DISTINCT stock.id_almacen', 'warehouseId')
      .where('stock.id_sede = :headquartersId', {
        headquartersId: String(headquartersId).trim(),
      })
      .getRawMany<{ warehouseId: number | string }>();

    return rows
      .map((row) => Number(row.warehouseId))
      .filter((warehouseId) => Number.isInteger(warehouseId) && warehouseId > 0);
  }

  private async resolveHeadquartersMap(
    warehouseIds: number[],
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    const uniqueIds = Array.from(
      new Set(warehouseIds.filter((warehouseId) => warehouseId > 0)),
    );

    if (uniqueIds.length === 0) {
      return map;
    }

    const rows = await this.stockRepo
      .createQueryBuilder('stock')
      .select('stock.id_almacen', 'warehouseId')
      .addSelect('MAX(stock.id_sede)', 'headquartersId')
      .where('stock.id_almacen IN (:...warehouseIds)', { warehouseIds: uniqueIds })
      .groupBy('stock.id_almacen')
      .getRawMany<{ warehouseId: number | string; headquartersId: string | null }>();

    rows.forEach((row) => {
      const warehouseId = Number(row.warehouseId);
      if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
        return;
      }

      const headquartersId = String(row.headquartersId ?? '').trim();
      map.set(warehouseId, headquartersId || 'SIN-SEDE');
    });

    uniqueIds.forEach((warehouseId) => {
      if (!map.has(warehouseId)) {
        map.set(warehouseId, 'SIN-SEDE');
      }
    });

    return map;
  }
}
