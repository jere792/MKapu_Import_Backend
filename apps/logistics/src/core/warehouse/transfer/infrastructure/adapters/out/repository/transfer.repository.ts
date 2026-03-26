import { Injectable, Logger } from '@nestjs/common';
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
import {
  type TransferListSummary,
  TransferPortsOut,
} from '../../../../domain/ports/out/transfer-ports-out';
import { TransferMapper } from '../../../../application/mapper/transfer-mapper';
import { StoreOrmEntity } from '../../../../../store/infrastructure/entity/store-orm.entity';
import { TransferDetailOrmEntity } from '../../../entity/transfer-detail-orm.entity';
import { TransferOrmEntity } from '../../../entity/transfer-orm.entity';
import { SedeAlmacenTcpProxy } from '../TCP/sede-almacen-tcp.proxy';

type TransferListSummaryRow = {
  id: number | string;
  originWarehouseId: number | string;
  destinationWarehouseId: number | string;
  requestDate: Date | string | null;
  status: string | null;
  observation: string | null;
  creatorUserId: number | string | null;
  approveUserId: number | string | null;
  totalQuantity: number | string | null;
  firstProductId: number | string | null;
};

@Injectable()
export class TransferRepository implements TransferPortsOut {
  private readonly logger = new Logger(TransferRepository.name);
  private readonly lookupCacheTtlMs = 60_000;
  private readonly warehousesByHeadquarterCache = new Map<
    string,
    { value: number[]; expiresAt: number }
  >();
  private readonly headquarterByWarehouseCache = new Map<
    number,
    { value: string; expiresAt: number }
  >();

  constructor(
    @InjectRepository(TransferOrmEntity)
    private readonly transferRepo: Repository<TransferOrmEntity>,
    @InjectRepository(StoreOrmEntity)
    private readonly storeRepo: Repository<StoreOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly sedeAlmacenTcpProxy: SedeAlmacenTcpProxy,
  ) {}

  async save(transfer: Transfer, manager?: EntityManager): Promise<Transfer> {
    const entityManager = manager ?? this.dataSource.manager;
    const transferRepository = entityManager.getRepository(TransferOrmEntity);
    const detailRepository = entityManager.getRepository(
      TransferDetailOrmEntity,
    );

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
    const warehouseIds =
      await this.findWarehouseIdsByHeadquarters(headquartersId);
    if (warehouseIds.length === 0) {
      return [];
    }

    const entities =
      await this.loadTransfersWithDetailsByWarehouseIds(warehouseIds);

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findNotificationCandidatesByHeadquarters(
    headquartersId: string,
  ): Promise<Transfer[]> {
    const warehouseIds =
      await this.findWarehouseIdsByHeadquarters(headquartersId);
    if (warehouseIds.length === 0) {
      return [];
    }

    const entities =
      await this.loadTransfersWithDetailsByWarehouseIds(warehouseIds);

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findAll(): Promise<Transfer[]> {
    const entities = await this.transferRepo.find({
      relations: ['details'],
      order: { date: 'DESC', id: 'DESC' },
    });

    return this.mapEntitiesWithHeadquarters(entities);
  }

  async findAllPaginated(
    page: number,
    pageSize: number,
    headquartersId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{ transfers: TransferListSummary[]; total: number }> {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

    let scopedWarehouseIds: number[] | null = null;
    if (String(headquartersId ?? '').trim()) {
      scopedWarehouseIds =
        await this.findWarehouseIdsByHeadquarters(headquartersId);
      if (scopedWarehouseIds.length === 0) {
        return { transfers: [], total: 0 };
      }
    }

    const baseQuery = this.transferRepo.createQueryBuilder('transfer');
    this.applyDateRangeFilter(baseQuery, dateFrom, dateTo);

    if (scopedWarehouseIds) {
      this.applyHeadquartersFilter(baseQuery, scopedWarehouseIds);
    }

    const total = await baseQuery.getCount();
    if (total === 0) {
      return { transfers: [], total: 0 };
    }

    const idRows = await baseQuery
      .clone()
      .select('transfer.id', 'id')
      .orderBy('transfer.date', 'DESC')
      .addOrderBy('transfer.id', 'DESC')
      .skip((safePage - 1) * safePageSize)
      .take(safePageSize)
      .getRawMany<{ id: number | string }>();

    const transferIds = this.extractTransferIds(idRows);
    if (transferIds.length === 0) {
      return { transfers: [], total };
    }

    const transfers = await this.loadTransferListSummaries(transferIds);

    return { transfers, total };
  }

  private applyDateRangeFilter(
    query: SelectQueryBuilder<TransferOrmEntity>,
    dateFrom?: Date,
    dateTo?: Date,
  ): void {
    if (dateFrom && dateTo) {
      query.andWhere('transfer.date BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
      return;
    }

    if (dateFrom) {
      query.andWhere('transfer.date >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query.andWhere('transfer.date <= :dateTo', { dateTo });
    }
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

  private async loadTransfersWithDetailsByWarehouseIds(
    warehouseIds: number[],
  ): Promise<TransferOrmEntity[]> {
    const idRows = await this.transferRepo
      .createQueryBuilder('transfer')
      .select('transfer.id', 'id')
      .where(
        '(transfer.originWarehouseId IN (:...warehouseIds) OR transfer.destinationWarehouseId IN (:...warehouseIds))',
        { warehouseIds },
      )
      .orderBy('transfer.date', 'DESC')
      .addOrderBy('transfer.id', 'DESC')
      .getRawMany<{ id: number | string }>();

    const transferIds = this.extractTransferIds(idRows);
    if (transferIds.length === 0) {
      return [];
    }

    const entities = await this.loadTransfersWithDetailsByIds(transferIds);
    return this.sortTransfersByIds(entities, transferIds);
  }

  private async loadTransfersWithDetailsByIds(
    transferIds: number[],
  ): Promise<TransferOrmEntity[]> {
    if (transferIds.length === 0) {
      return [];
    }

    return this.transferRepo.find({
      where: { id: In(transferIds) },
      relations: ['details'],
    });
  }

  private sortTransfersByIds(
    entities: TransferOrmEntity[],
    orderedTransferIds: number[],
  ): TransferOrmEntity[] {
    const entitiesById = new Map(
      entities.map((entity) => [entity.id, entity] as const),
    );

    return orderedTransferIds
      .map((transferId) => entitiesById.get(transferId) ?? null)
      .filter((entity): entity is TransferOrmEntity => entity !== null);
  }

  private async loadTransferListSummaries(
    transferIds: number[],
  ): Promise<TransferListSummary[]> {
    if (transferIds.length === 0) {
      return [];
    }

    const rows = await this.transferRepo
      .createQueryBuilder('transfer')
      .leftJoin(
        TransferDetailOrmEntity,
        'detail',
        'detail.transferId = transfer.id',
      )
      .select('transfer.id', 'id')
      .addSelect('transfer.originWarehouseId', 'originWarehouseId')
      .addSelect('transfer.destinationWarehouseId', 'destinationWarehouseId')
      .addSelect('transfer.date', 'requestDate')
      .addSelect('transfer.status', 'status')
      .addSelect('transfer.motive', 'observation')
      .addSelect('transfer.userIdRefOrigin', 'creatorUserId')
      .addSelect('transfer.userIdRefDest', 'approveUserId')
      .addSelect('COALESCE(SUM(detail.quantity), 0)', 'totalQuantity')
      .addSelect('MIN(detail.productId)', 'firstProductId')
      .where('transfer.id IN (:...transferIds)', { transferIds })
      .groupBy('transfer.id')
      .addGroupBy('transfer.originWarehouseId')
      .addGroupBy('transfer.destinationWarehouseId')
      .addGroupBy('transfer.date')
      .addGroupBy('transfer.status')
      .addGroupBy('transfer.motive')
      .addGroupBy('transfer.userIdRefOrigin')
      .addGroupBy('transfer.userIdRefDest')
      .getRawMany<TransferListSummaryRow>();

    if (rows.length === 0) {
      return [];
    }

    const warehouseIds = Array.from(
      new Set(
        rows.flatMap((row) => [
          Number(row.originWarehouseId),
          Number(row.destinationWarehouseId),
        ]),
      ),
    ).filter((warehouseId) => Number.isInteger(warehouseId) && warehouseId > 0);
    const headquartersMap = await this.resolveHeadquartersMap(warehouseIds);
    const summaryById = new Map<number, TransferListSummary>();

    rows.forEach((row) => {
      const transferId = Number(row.id);
      if (!Number.isInteger(transferId) || transferId <= 0) {
        return;
      }

      const originWarehouseId = Number(row.originWarehouseId);
      const destinationWarehouseId = Number(row.destinationWarehouseId);
      const requestDate =
        row.requestDate instanceof Date
          ? row.requestDate
          : row.requestDate
            ? new Date(row.requestDate)
            : null;

      summaryById.set(transferId, {
        id: transferId,
        creatorUserId:
          this.toOptionalPositiveInteger(row.creatorUserId) ?? undefined,
        approveUserId:
          this.toOptionalPositiveInteger(row.approveUserId) ?? undefined,
        originHeadquartersId:
          headquartersMap.get(originWarehouseId) ?? 'SIN-SEDE',
        originWarehouseId,
        destinationHeadquartersId:
          headquartersMap.get(destinationWarehouseId) ?? 'SIN-SEDE',
        destinationWarehouseId,
        firstProductId:
          this.toOptionalPositiveInteger(row.firstProductId) ?? undefined,
        totalQuantity: Math.max(0, Number(row.totalQuantity ?? 0)),
        status: (row.status as TransferStatus) ?? TransferStatus.REQUESTED,
        observation: row.observation ?? undefined,
        requestDate:
          requestDate instanceof Date && !Number.isNaN(requestDate.getTime())
            ? requestDate
            : null,
      });
    });

    return transferIds
      .map((transferId) => summaryById.get(transferId) ?? null)
      .filter((summary): summary is TransferListSummary => summary !== null);
  }

  private extractTransferIds(rows: Array<{ id: number | string }>): number[] {
    return rows
      .map((row) => Number(row.id))
      .filter((id) => Number.isInteger(id) && id > 0);
  }

  private async findWarehouseIdsByHeadquarters(
    headquartersId: string,
  ): Promise<number[]> {
    const normalizedHeadquartersId = String(headquartersId ?? '').trim();
    if (!normalizedHeadquartersId) {
      return [];
    }

    const cachedWarehouseIds = this.getCachedValue(
      this.warehousesByHeadquarterCache,
      normalizedHeadquartersId,
    );
    if (cachedWarehouseIds) {
      return [...cachedWarehouseIds];
    }

    const storeRows = await this.storeRepo
      .createQueryBuilder('warehouse')
      .select('warehouse.id_almacen', 'warehouseId')
      .where('warehouse.id_sede = :headquartersId', {
        headquartersId: Number(normalizedHeadquartersId),
      })
      .getRawMany<{ warehouseId: number | string }>();

    const storeWarehouseIds = storeRows
      .map((row) => Number(row.warehouseId))
      .filter(
        (warehouseId) => Number.isInteger(warehouseId) && warehouseId > 0,
      );

    if (storeWarehouseIds.length > 0) {
      this.setCachedValue(
        this.warehousesByHeadquarterCache,
        normalizedHeadquartersId,
        storeWarehouseIds,
      );
      this.logger.debug(
        `[TransferHeadquarterScope] hq=${normalizedHeadquartersId} source=store total=${storeWarehouseIds.length}`,
      );
      return storeWarehouseIds;
    }

    const tcpWarehouseIds =
      await this.sedeAlmacenTcpProxy.findWarehouseIdsBySede(
        normalizedHeadquartersId,
      );
    const resolvedWarehouseIds = Array.from(new Set(tcpWarehouseIds));

    this.logger.debug(
      `[TransferHeadquarterScope] hq=${normalizedHeadquartersId} source=tcp total=${resolvedWarehouseIds.length}`,
    );

    this.setCachedValue(
      this.warehousesByHeadquarterCache,
      normalizedHeadquartersId,
      resolvedWarehouseIds,
    );

    return resolvedWarehouseIds;
  }

  private async resolveHeadquartersMap(
    warehouseIds: number[],
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    const uniqueIds = Array.from(
      new Set(
        warehouseIds.filter(
          (warehouseId) => Number.isInteger(warehouseId) && warehouseId > 0,
        ),
      ),
    );

    if (uniqueIds.length === 0) {
      return map;
    }

    const missingWarehouseIds: number[] = [];
    uniqueIds.forEach((warehouseId) => {
      const cachedHeadquarterId = this.getCachedValue(
        this.headquarterByWarehouseCache,
        warehouseId,
      );
      if (cachedHeadquarterId) {
        map.set(warehouseId, cachedHeadquarterId);
        return;
      }

      missingWarehouseIds.push(warehouseId);
    });

    if (missingWarehouseIds.length === 0) {
      return map;
    }

    const storeRows = await this.storeRepo
      .createQueryBuilder('warehouse')
      .select('warehouse.id_almacen', 'warehouseId')
      .addSelect('warehouse.id_sede', 'headquartersId')
      .where('warehouse.id_almacen IN (:...warehouseIds)', {
        warehouseIds: missingWarehouseIds,
      })
      .getRawMany<{
        warehouseId: number | string;
        headquartersId: number | string | null;
      }>();

    storeRows.forEach((row) => {
      const warehouseId = Number(row.warehouseId);
      const headquartersId = String(row.headquartersId ?? '').trim();
      if (
        Number.isInteger(warehouseId) &&
        warehouseId > 0 &&
        headquartersId &&
        !map.has(warehouseId)
      ) {
        map.set(warehouseId, headquartersId);
        this.setCachedValue(
          this.headquarterByWarehouseCache,
          warehouseId,
          headquartersId,
        );
      }
    });

    const unresolvedWarehouseIds = uniqueIds.filter(
      (warehouseId) => !map.has(warehouseId),
    );
    if (unresolvedWarehouseIds.length > 0) {
      const tcpAssignments =
        await this.sedeAlmacenTcpProxy.findHeadquartersByWarehouseIds(
          unresolvedWarehouseIds,
        );
      tcpAssignments.forEach((assignment, warehouseId) => {
        const headquartersId = String(assignment.id_sede ?? '').trim();
        if (headquartersId) {
          map.set(warehouseId, headquartersId);
          this.setCachedValue(
            this.headquarterByWarehouseCache,
            warehouseId,
            headquartersId,
          );
        }
      });
    }

    uniqueIds.forEach((warehouseId) => {
      if (!map.has(warehouseId)) {
        map.set(warehouseId, 'SIN-SEDE');
        this.setCachedValue(
          this.headquarterByWarehouseCache,
          warehouseId,
          'SIN-SEDE',
        );
      }
    });

    return map;
  }

  private toOptionalPositiveInteger(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private getCachedValue<TKey, TValue>(
    cache: Map<TKey, { value: TValue; expiresAt: number }>,
    key: TKey,
  ): TValue | null {
    const cachedEntry = cache.get(key);
    if (!cachedEntry) {
      return null;
    }

    if (cachedEntry.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }

    return cachedEntry.value;
  }

  private setCachedValue<TKey, TValue>(
    cache: Map<TKey, { value: TValue; expiresAt: number }>,
    key: TKey,
    value: TValue,
  ): void {
    cache.set(key, {
      value,
      expiresAt: Date.now() + this.lookupCacheTtlMs,
    });
  }
}
