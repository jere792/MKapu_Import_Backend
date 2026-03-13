import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UnitPortsOut } from 'apps/logistics/src/core/catalog/unit/domain/port/out/unit-ports-out';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { StockOrmEntity } from '../../../inventory/infrastructure/entity/stock-orm-entity';
import { InventoryCommandService } from '../../../inventory/application/service/inventory/inventory-command.service';
import { StoreOrmEntity } from '../../../store/infrastructure/entity/store-orm.entity';
import { ListTransferNotificationQueryDto } from '../dto/in/list-transfer-notification-query.dto';
import { ListTransferQueryDto } from '../dto/in/list-transfer-query.dto';
import { ApproveTransferDto } from '../dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../dto/in/confirm-receipt-transfer.dto';
import { RejectTransferDto } from '../dto/in/reject-transfer.dto';
import {
  RequestTransferDto,
  RequestTransferItemDto,
} from '../dto/in/request-transfer.dto';
import type { TransferByIdResponseDto } from '../dto/out/transfer-by-id-response.dto';
import type { TransferListPaginatedResponseDto } from '../dto/out/transfer-list-paginated-response.dto';
import type { TransferListResponseDto } from '../dto/out/transfer-list-response.dto';
import type { TransferNotificationResponseDto } from '../dto/out/transfer-notification-response.dto';
import {
  Transfer,
  TransferItem,
  TransferMode,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import { TransferNotificationMapper } from '../mapper/transfer-notification.mapper';
import { TransferPortsIn } from '../../domain/ports/in/transfer-ports-in';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';
import { TransferWebsocketGateway } from '../../infrastructure/adapters/out/transfer-websocket.gateway';
import type { TransferGatewayTransferPayload } from '../../infrastructure/adapters/out/transfer-websocket.payload';
import { UsuarioTcpProxy } from '../../infrastructure/adapters/out/TCP/usuario-tcp.proxy';
import { SedeAlmacenTcpProxy } from '../../infrastructure/adapters/out/TCP/sede-almacen-tcp.proxy';
import { TransferOrmEntity } from '../../infrastructure/entity/transfer-orm.entity';

type NormalizedTransferItem = {
  productId: number;
  quantity: number;
  series: string[];
};

type RawUnit = {
  serialNumber?: string;
  serie?: string;
  series?: string;
  status?: string;
  estado?: string;
  warehouseId?: number | string;
  id_almacen?: number | string;
  productId?: number | string;
  id_producto?: number | string;
};

type PaginatedTransfersResult = {
  transfers: Transfer[];
  total: number;
};

type TransferLookupUserDto = {
  id_usuario: number;
  usu_nom: string;
  ape_pat: string;
  ape_mat?: string;
};

type TransferLookupHeadquarterDto = {
  id_sede: string;
  nombre: string;
};

type TransferLookupWarehouseDto = {
  id_almacen: number;
  nombre: string;
};

type TransferLookupProductDto = {
  id_producto: number;
  codigo: string;
  nomProducto: string;
  descripcion: string;
  categoria: {
    id_categoria: number;
    nombre: string;
  } | null;
};

type TransferResponseUserDto = {
  idUsuario: number;
  usuNom: string;
  apePat: string;
  apeMat?: string;
};

@Injectable()
export class TransferCommandService implements TransferPortsIn {
  private readonly logger = new Logger(TransferCommandService.name);
  private resolvedAdminDatabaseName: string | null | undefined = undefined;

  constructor(
    @Inject('TransferPortsOut')
    private readonly transferRepo: TransferPortsOut,
    private readonly dataSource: DataSource,
    @Inject('UnitPortsOut')
    private readonly unitRepo: UnitPortsOut,
    private readonly transferGateway: TransferWebsocketGateway,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    @InjectRepository(StoreOrmEntity)
    private readonly storeRepo: Repository<StoreOrmEntity>,
    private readonly inventoryService: InventoryCommandService,
    private readonly usuarioTcpProxy: UsuarioTcpProxy,
    private readonly sedeAlmacenTcpProxy: SedeAlmacenTcpProxy,
  ) {}

  async requestTransfer(dto: RequestTransferDto): Promise<Transfer> {
    this.validateWarehouseSelection(dto);
    await this.validateWarehouseBelongsToHeadquarters(
      dto.originWarehouseId,
      dto.originHeadquartersId,
    );
    await this.validateWarehouseBelongsToHeadquarters(
      dto.destinationWarehouseId,
      dto.destinationHeadquartersId,
    );

    const normalizedItems = this.normalizeRequestItems(dto.items);
    const transferMode = this.resolveTransferMode(
      dto.transferMode,
      normalizedItems,
    );
    const groupedRequest =
      this.groupRequestedQuantityByProduct(normalizedItems);
    await this.validateStockLevels(groupedRequest, dto.originWarehouseId);

    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      if (transferMode === TransferMode.SERIALIZED) {
        await this.validateSerializedUnits(
          normalizedItems,
          dto.originWarehouseId,
          manager,
        );
      }

      const transfer = new Transfer(
        dto.originHeadquartersId,
        dto.originWarehouseId,
        dto.destinationHeadquartersId,
        dto.destinationWarehouseId,
        normalizedItems.map((item) =>
          transferMode === TransferMode.AGGREGATED
            ? TransferItem.fromQuantity(item.productId, item.quantity)
            : new TransferItem(item.productId, item.series),
        ),
        dto.observation,
        undefined,
        dto.userId,
        TransferStatus.REQUESTED,
        undefined,
        undefined,
        undefined,
        undefined,
        transferMode,
      );

      const persistedTransfer = await this.transferRepo.save(transfer, manager);

      if (transferMode === TransferMode.SERIALIZED) {
        const allSeries = normalizedItems.flatMap((item) => item.series);
        await this.unitRepo.updateStatusBySerials(
          allSeries,
          UnitStatus.TRANSFERRING,
          manager,
        );
      }

      return persistedTransfer;
    });

    const realtimePayload =
      await this.buildRealtimeTransferPayload(savedTransfer);
    this.transferGateway.notifyNewRequest(
      dto.destinationHeadquartersId,
      realtimePayload,
    );

    return savedTransfer;
  }

  async approveTransfer(
    transferId: number,
    dto: ApproveTransferDto,
  ): Promise<Transfer> {
    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      const transfer = await this.loadTransferForUpdate(manager, transferId);
      if (transfer.status !== TransferStatus.REQUESTED) {
        throw new ConflictException(
          'Solo se pueden aprobar transferencias en estado SOLICITADA.',
        );
      }

      const groupedItems = this.groupTransferQuantityByProduct(transfer.items);
      await this.validateStockLevels(groupedItems, transfer.originWarehouseId);
      if (transfer.mode === TransferMode.SERIALIZED) {
        await this.validateTransferSeriesBeforeApproval(transfer, manager);
      }

      transfer.approve();
      const transferDocId = this.requireTransferId(transfer);

      await this.inventoryService.registerExit(
        {
          refId: transferDocId,
          refTable: 'transferencia',
          observation: `Salida por transferencia #${transferDocId} (Aprobado por usuario ${dto.userId})`,
          items: this.toInventoryItems(
            groupedItems,
            transfer.originWarehouseId,
            transfer.originHeadquartersId,
          ),
        },
        manager,
      );

      return this.transferRepo.save(transfer, manager);
    });

    await this.notifyStatusToBothHeadquarters(
      savedTransfer,
      TransferStatus.APPROVED,
    );
    return savedTransfer;
  }

  async confirmReceipt(
    transferId: number,
    dto: ConfirmReceiptTransferDto,
  ): Promise<Transfer> {
    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      const transfer = await this.loadTransferForUpdate(manager, transferId);
      if (transfer.status !== TransferStatus.APPROVED) {
        throw new ConflictException(
          'Solo se puede confirmar la recepcion de transferencias APROBADAS.',
        );
      }

      if (transfer.mode === TransferMode.SERIALIZED) {
        const allSeries = transfer.items.flatMap((item) => item.series);
        await Promise.all(
          allSeries.map((serial) =>
            this.unitRepo.updateLocationAndStatusBySerial(
              serial,
              transfer.destinationWarehouseId,
              UnitStatus.AVAILABLE,
              manager,
            ),
          ),
        );
      }

      const groupedItems = this.groupTransferQuantityByProduct(transfer.items);
      await this.ensureDestinationStockRows(
        manager,
        groupedItems,
        transfer.originWarehouseId,
        transfer.destinationWarehouseId,
        transfer.destinationHeadquartersId,
      );

      const transferDocId = this.requireTransferId(transfer);
      await this.inventoryService.registerIncome(
        {
          refId: transferDocId,
          refTable: 'transferencia',
          observation: `Ingreso por transferencia #${transferDocId} (Confirmado por usuario ${dto.userId})`,
          items: this.toInventoryItems(
            groupedItems,
            transfer.destinationWarehouseId,
            transfer.destinationHeadquartersId,
          ),
        },
        manager,
      );

      transfer.complete();
      transfer.approveUserId = dto.userId;
      return this.transferRepo.save(transfer, manager);
    });

    await this.notifyStatusToBothHeadquarters(
      savedTransfer,
      TransferStatus.COMPLETED,
    );
    return savedTransfer;
  }

  async rejectTransfer(
    transferId: number,
    dto: RejectTransferDto,
  ): Promise<Transfer> {
    const savedTransfer = await this.dataSource.transaction(async (manager) => {
      const transfer = await this.loadTransferForUpdate(manager, transferId);
      if (transfer.status === TransferStatus.REJECTED) {
        throw new ConflictException(
          'La transferencia ya se encuentra rechazada.',
        );
      }
      if (transfer.status === TransferStatus.COMPLETED) {
        throw new ConflictException(
          'No se puede rechazar una transferencia completada.',
        );
      }

      if (transfer.status === TransferStatus.APPROVED) {
        const groupedItems = this.groupTransferQuantityByProduct(
          transfer.items,
        );
        const transferDocId = this.requireTransferId(transfer);
        await this.inventoryService.registerIncome(
          {
            refId: transferDocId,
            refTable: 'transferencia',
            observation: `Reversion de salida por rechazo de transferencia #${transferDocId} (Usuario ${dto.userId})`,
            items: this.toInventoryItems(
              groupedItems,
              transfer.originWarehouseId,
              transfer.originHeadquartersId,
            ),
          },
          manager,
        );
      }

      transfer.reject(dto.reason);
      transfer.approveUserId = dto.userId;

      if (transfer.mode === TransferMode.SERIALIZED) {
        const allSeries = transfer.items.flatMap((item) => item.series);
        await this.unitRepo.updateStatusBySerials(
          allSeries,
          UnitStatus.AVAILABLE,
          manager,
        );
      }

      return this.transferRepo.save(transfer, manager);
    });

    await this.notifyStatusToBothHeadquarters(
      savedTransfer,
      TransferStatus.REJECTED,
      dto.reason,
    );
    return savedTransfer;
  }

  getTransfersByHeadquarters(headquartersId: string): Promise<Transfer[]> {
    return this.transferRepo.findByHeadquarters(headquartersId);
  }

  async getTransferById(id: number): Promise<TransferByIdResponseDto> {
    const transfer = await this.transferRepo.findById(id);
    if (!transfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }

    const originHeadquartersId = String(
      transfer.originHeadquartersId ?? '',
    ).trim();
    const destinationHeadquartersId = String(
      transfer.destinationHeadquartersId ?? '',
    ).trim();

    const [
      creatorUser,
      approveUser,
      originHeadquarter,
      destinationHeadquarter,
      originWarehouse,
      destinationWarehouse,
    ] = await Promise.all([
      this.getUserById(transfer.creatorUserId),
      this.getUserById(transfer.approveUserId),
      this.getHeadquarterById(originHeadquartersId),
      this.getHeadquarterById(destinationHeadquartersId),
      this.getWarehouseById(transfer.originWarehouseId),
      this.getWarehouseById(transfer.destinationWarehouseId),
    ]);

    const productCache = new Map<number, TransferLookupProductDto | null>();
    const items = await Promise.all(
      transfer.items.map(async (item) => {
        const productId = Number(item.productId);

        let product = productCache.get(productId);
        if (product === undefined) {
          product = await this.getProductById(productId);
          productCache.set(productId, product);
        }

        return {
          productId,
          series: item.series ?? [],
          quantity: Number(item.quantity ?? 0),
          producto: product
            ? {
                id_producto: product.id_producto,
                categoria: product.categoria,
                codigo: product.codigo,
                nomProducto: product.nomProducto,
                descripcion: product.descripcion,
              }
            : null,
        };
      }),
    );

    const approveUserResponse = this.mapUserToResponse(approveUser);
    const creatorUserResponse = this.mapUserToResponse(creatorUser);

    return {
      id: transfer.id,
      creatorUserId: transfer.creatorUserId,
      approveUserId: transfer.approveUserId,
      originHeadquartersId,
      originWarehouseId: transfer.originWarehouseId,
      destinationHeadquartersId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      approveUser: approveUserResponse,
      origin: {
        id_sede: originHeadquartersId,
        nomSede:
          originHeadquarter?.nombre ?? `Sede ${originHeadquartersId || '-'}`,
      },
      originWarehouse: {
        id_almacen: transfer.originWarehouseId,
        nomAlm:
          originWarehouse?.nombre ??
          `Almac??????????????????n ${String(transfer.originWarehouseId)}`,
      },
      destination: {
        id_sede: destinationHeadquartersId,
        nomSede:
          destinationHeadquarter?.nombre ??
          `Sede ${destinationHeadquartersId || '-'}`,
      },
      destinationWarehouse: {
        id_almacen: transfer.destinationWarehouseId,
        nomAlm:
          destinationWarehouse?.nombre ??
          `Almac??????????????????n ${String(transfer.destinationWarehouseId)}`,
      },
      totalQuantity: transfer.totalQuantity,
      status: transfer.status,
      observation: transfer.observation,
      requestDate: transfer.requestDate,
      responseDate: transfer.responseDate,
      completionDate: transfer.completionDate,
      items,
      creatorUser: creatorUserResponse,
    };
  }

  async getTransferNotifications(
    query: ListTransferNotificationQueryDto,
  ): Promise<TransferNotificationResponseDto[]> {
    const headquartersId = String(query.headquartersId ?? '').trim();
    if (!headquartersId) {
      throw new BadRequestException(
        'El parametro headquartersId es obligatorio para listar notificaciones de transferencias.',
      );
    }

    if (!this.isAdministratorRole(query.role)) {
      return [];
    }

    const transfers =
      await this.transferRepo.findNotificationCandidatesByHeadquarters(
        headquartersId,
      );
    if (transfers.length === 0) {
      return [];
    }

    const relevantTransfers = transfers.filter((transfer) =>
      this.shouldIncludeTransferNotification(transfer, headquartersId),
    );
    if (relevantTransfers.length === 0) {
      return [];
    }

    const headquarterIds = Array.from(
      new Set(
        relevantTransfers.flatMap((transfer) => [
          String(transfer.originHeadquartersId ?? '').trim(),
          String(transfer.destinationHeadquartersId ?? '').trim(),
        ]),
      ),
    ).filter((value) => Boolean(value));

    const headquarterCache = new Map<
      string,
      TransferLookupHeadquarterDto | null
    >();
    await Promise.all(
      headquarterIds.map(async (id) => {
        headquarterCache.set(id, await this.getHeadquarterById(id));
      }),
    );

    return relevantTransfers.map((transfer) => {
      const originHeadquartersId = String(
        transfer.originHeadquartersId ?? '',
      ).trim();
      const destinationHeadquartersId = String(
        transfer.destinationHeadquartersId ?? '',
      ).trim();

      const originHeadquarter = headquarterCache.get(originHeadquartersId);
      const destinationHeadquarter = headquarterCache.get(
        destinationHeadquartersId,
      );

      return TransferNotificationMapper.toResponseDto(
        transfer,
        originHeadquarter?.nombre ?? `Sede ${originHeadquartersId || '-'}`,
        destinationHeadquarter?.nombre ??
          `Sede ${destinationHeadquartersId || '-'}`,
      );
    });
  }

  async getAllTransfers(
    query: ListTransferQueryDto,
  ): Promise<TransferListPaginatedResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const headquartersId = String(query.headquartersId ?? '').trim();

    if (!headquartersId) {
      throw new BadRequestException(
        'El parametro headquartersId es obligatorio para listar transferencias.',
      );
    }

    const paginatedResult = await this.loadPaginatedTransfers(
      page,
      pageSize,
      headquartersId,
    );
    const { transfers, total } = paginatedResult;

    const headquarterCache = new Map<
      string,
      TransferLookupHeadquarterDto | null
    >();
    const userCache = new Map<number, TransferLookupUserDto | null>();
    const productCache = new Map<number, TransferLookupProductDto | null>();

    const data: TransferListResponseDto[] =
      await this.mapTransfersToListResponse(
        transfers,
        headquarterCache,
        userCache,
        productCache,
      );

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const response: TransferListPaginatedResponseDto = {
      data,
      pagination: {
        page,
        pageSize,
        totalRecords: total,
        totalPages,
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
    return response;
  }

  private async loadTransferForUpdate(
    manager: EntityManager,
    transferId: number,
  ): Promise<Transfer> {
    const transferOrm = await manager
      .getRepository(TransferOrmEntity)
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.details', 'details')
      .where('transfer.id = :transferId', { transferId })
      .setLock('pessimistic_write')
      .getOne();

    if (!transferOrm) {
      throw new NotFoundException('Transferencia no encontrada');
    }

    const originHeadquartersId = await this.resolveHeadquartersByWarehouse(
      manager,
      transferOrm.originWarehouseId,
    );
    const destinationHeadquartersId = await this.resolveHeadquartersByWarehouse(
      manager,
      transferOrm.destinationWarehouseId,
    );

    const transferMode =
      transferOrm.operationType === 'TRANSFERENCIA_AGGREGATED'
        ? TransferMode.AGGREGATED
        : TransferMode.SERIALIZED;

    const items: TransferItem[] = [];
    const details = transferOrm.details ?? [];

    if (transferMode === TransferMode.AGGREGATED) {
      const groupedQuantities = new Map<number, number>();
      details.forEach((detail) => {
        groupedQuantities.set(
          detail.productId,
          (groupedQuantities.get(detail.productId) ?? 0) +
            Number(detail.quantity ?? 0),
        );
      });

      groupedQuantities.forEach((quantity, productId) => {
        items.push(TransferItem.fromQuantity(productId, quantity));
      });
    } else {
      const groupedSeries = new Map<number, string[]>();
      details.forEach((detail) => {
        const productSeries = groupedSeries.get(detail.productId) ?? [];
        productSeries.push(detail.serialNumber);
        groupedSeries.set(detail.productId, productSeries);
      });

      groupedSeries.forEach((series, productId) => {
        items.push(new TransferItem(productId, series));
      });
    }

    return new Transfer(
      originHeadquartersId,
      transferOrm.originWarehouseId,
      destinationHeadquartersId,
      transferOrm.destinationWarehouseId,
      items,
      transferOrm.motive ?? undefined,
      transferOrm.id,
      transferOrm.userIdRefOrigin ?? undefined,
      transferOrm.status as TransferStatus,
      transferOrm.date,
      undefined,
      undefined,
      transferOrm.userIdRefDest ?? undefined,
      transferMode,
    );
  }

  private async ensureDestinationStockRows(
    manager: EntityManager,
    groupedItems: Map<number, number>,
    originWarehouseId: number,
    destinationWarehouseId: number,
    destinationHeadquartersId: string,
  ): Promise<void> {
    const stockRepository = manager.getRepository(StockOrmEntity);

    for (const [productId] of groupedItems.entries()) {
      const destinationStock = await stockRepository.findOne({
        where: {
          id_producto: productId,
          id_almacen: destinationWarehouseId,
          id_sede: destinationHeadquartersId,
        },
        order: { id_stock: 'ASC' },
      });

      if (destinationStock) {
        continue;
      }

      const originStock = await stockRepository.findOne({
        where: {
          id_producto: productId,
          id_almacen: originWarehouseId,
        },
        order: { id_stock: 'ASC' },
      });

      await stockRepository.save(
        stockRepository.create({
          id_producto: productId,
          id_almacen: destinationWarehouseId,
          id_sede: destinationHeadquartersId,
          tipo_ubicacion: originStock?.tipo_ubicacion ?? 'ALMACEN',
          cantidad: 0,
          estado: originStock?.estado ?? '1',
        }),
      );
    }
  }

  private async resolveHeadquartersByWarehouse(
    manager: EntityManager,
    warehouseId: number,
  ): Promise<string> {
    const tcpAssignment =
      await this.sedeAlmacenTcpProxy.findHeadquarterByWarehouseId(warehouseId);
    if (tcpAssignment?.id_sede) {
      return tcpAssignment.id_sede;
    }

    const warehouse = await manager.getRepository(StoreOrmEntity).findOne({
      where: { id_almacen: warehouseId },
      select: ['id_almacen', 'id_sede'],
    });
    if (warehouse?.id_sede !== null && warehouse?.id_sede !== undefined) {
      const warehouseHeadquartersId = String(warehouse.id_sede).trim();
      if (warehouseHeadquartersId) {
        return warehouseHeadquartersId;
      }
    }

    const stockRow = await manager
      .getRepository(StockOrmEntity)
      .createQueryBuilder('stock')
      .select('stock.id_sede', 'id_sede')
      .where('stock.id_almacen = :warehouseId', { warehouseId })
      .andWhere("TRIM(COALESCE(stock.id_sede, '')) <> ''")
      .groupBy('stock.id_sede')
      .orderBy('stock.id_sede', 'ASC')
      .limit(1)
      .getRawOne<{ id_sede: string | null }>();

    const stockHeadquartersId = String(stockRow?.id_sede ?? '').trim();
    if (stockHeadquartersId) {
      return stockHeadquartersId;
    }

    throw new BadRequestException(
      `No se encontro la sede asociada al almacen ${warehouseId}.`,
    );
  }

  private validateWarehouseSelection(dto: RequestTransferDto): void {
    if (dto.originWarehouseId === dto.destinationWarehouseId) {
      throw new BadRequestException(
        'El almacen de origen y destino deben ser distintos.',
      );
    }
  }

  private normalizeRequestItems(
    items: RequestTransferItemDto[],
  ): NormalizedTransferItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'Debe enviar al menos un producto para la transferencia.',
      );
    }

    const normalized = items.map((item) => {
      const productId = Number(item.productId);
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new BadRequestException(
          'El productId de cada item debe ser valido.',
        );
      }

      const normalizedSeries =
        item.series
          ?.map((value) => String(value).trim())
          .filter((value) => value.length > 0) ?? [];
      const hasSeries = normalizedSeries.length > 0;
      const hasQuantity =
        Number.isInteger(item.quantity) && Number(item.quantity) > 0;

      if (!hasSeries && !hasQuantity) {
        throw new BadRequestException(
          `El producto ${productId} debe tener series o quantity.`,
        );
      }

      if (hasSeries) {
        const uniqueSeries = new Set(normalizedSeries);
        if (uniqueSeries.size !== normalizedSeries.length) {
          throw new BadRequestException(
            `El producto ${productId} contiene series duplicadas.`,
          );
        }

        if (hasQuantity && item.quantity !== normalizedSeries.length) {
          throw new BadRequestException(
            `La quantity del producto ${productId} debe coincidir con la cantidad de series.`,
          );
        }

        return {
          productId,
          quantity: normalizedSeries.length,
          series: normalizedSeries,
        };
      }

      return {
        productId,
        quantity: Number(item.quantity),
        series: [],
      };
    });

    const allSeries = normalized.flatMap((item) => item.series);
    const uniqueSeries = new Set(allSeries);
    if (uniqueSeries.size !== allSeries.length) {
      throw new BadRequestException(
        'Existen series repetidas entre los productos enviados.',
      );
    }

    return normalized;
  }

  private resolveTransferMode(
    transferModeRaw: string | undefined,
    items: NormalizedTransferItem[],
  ): TransferMode {
    const hasSerializedItems = items.some((item) => item.series.length > 0);
    const hasAggregatedItems = items.some((item) => item.series.length === 0);

    if (hasSerializedItems && hasAggregatedItems) {
      throw new BadRequestException(
        'No se permite mezclar items con series y items por cantidad en una misma solicitud.',
      );
    }

    const inferredMode = hasSerializedItems
      ? TransferMode.SERIALIZED
      : TransferMode.AGGREGATED;

    if (!transferModeRaw) {
      return inferredMode;
    }

    const normalizedMode = String(transferModeRaw).trim().toUpperCase();
    let requestedMode: TransferMode | null = null;
    switch (normalizedMode) {
      case 'AGGREGATED':
        requestedMode = TransferMode.AGGREGATED;
        break;
      case 'SERIALIZED':
        requestedMode = TransferMode.SERIALIZED;
        break;
      default:
        requestedMode = null;
    }

    if (!requestedMode) {
      throw new BadRequestException(
        `transferMode invalido. Valores soportados: ${TransferMode.SERIALIZED}, ${TransferMode.AGGREGATED}.`,
      );
    }

    if (requestedMode !== inferredMode) {
      throw new BadRequestException(
        `transferMode ${requestedMode} no coincide con el formato de items enviado.`,
      );
    }

    return requestedMode;
  }

  private async validateSerializedUnits(
    items: NormalizedTransferItem[],
    originWarehouseId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const allSeries = items.flatMap((item) => item.series);
    if (allSeries.length === 0) {
      return;
    }

    const units = (await this.unitRepo.findBySerials(
      allSeries,
      manager,
    )) as unknown as RawUnit[];
    if (units.length !== allSeries.length) {
      throw new NotFoundException(
        'Algunas series no existen en la base de datos.',
      );
    }

    const seriesToProductMap = new Map<string, number>();
    items.forEach((item) => {
      item.series.forEach((serie) => {
        seriesToProductMap.set(serie, item.productId);
      });
    });

    const invalidUnits = units.filter((unit) => {
      const serial = String(
        unit.serialNumber ?? unit.serie ?? unit.series ?? '',
      ).trim();
      const expectedProductId = Number(seriesToProductMap.get(serial));
      const productId = Number(unit.productId ?? unit.id_producto);
      const warehouseId = Number(unit.warehouseId ?? unit.id_almacen);
      const status = String(unit.status ?? unit.estado ?? '')
        .trim()
        .toUpperCase();

      const isAvailable =
        status === UnitStatus.AVAILABLE.toUpperCase() ||
        status === 'DISPONIBLE' ||
        status === '1';

      return (
        !serial ||
        !isAvailable ||
        warehouseId !== originWarehouseId ||
        productId !== expectedProductId
      );
    });

    if (invalidUnits.length > 0) {
      throw new BadRequestException(
        'Hay series que no estan disponibles en el almacen de origen.',
      );
    }
  }

  private async validateTransferSeriesBeforeApproval(
    transfer: Transfer,
    manager?: EntityManager,
  ): Promise<void> {
    const allSeries = transfer.items.flatMap((item) => item.series);
    if (allSeries.length === 0) {
      return;
    }

    const units = (await this.unitRepo.findBySerials(
      allSeries,
      manager,
    )) as unknown as RawUnit[];
    if (units.length !== allSeries.length) {
      throw new ConflictException(
        'No se puede aprobar: existen series faltantes o inconsistentes.',
      );
    }

    const seriesToProductMap = new Map<string, number>();
    transfer.items.forEach((item) => {
      item.series.forEach((serie) => {
        seriesToProductMap.set(serie, item.productId);
      });
    });

    const invalidUnits = units.filter((unit) => {
      const serial = String(
        unit.serialNumber ?? unit.serie ?? unit.series ?? '',
      ).trim();
      const expectedProductId = Number(seriesToProductMap.get(serial));
      const productId = Number(unit.productId ?? unit.id_producto);
      const warehouseId = Number(unit.warehouseId ?? unit.id_almacen);
      const status = String(unit.status ?? unit.estado ?? '')
        .trim()
        .toUpperCase();

      const validStatuses = new Set([
        UnitStatus.TRANSFERRING.toUpperCase(),
        'TRANSFERIDO',
        '2',
        UnitStatus.AVAILABLE.toUpperCase(),
        'DISPONIBLE',
        '1',
      ]);

      return (
        !serial ||
        warehouseId !== transfer.originWarehouseId ||
        productId !== expectedProductId ||
        !validStatuses.has(status)
      );
    });

    if (invalidUnits.length > 0) {
      throw new ConflictException(
        'No se puede aprobar: las series no cumplen condiciones para despacho.',
      );
    }
  }

  private groupRequestedQuantityByProduct(
    items: NormalizedTransferItem[],
  ): Map<number, number> {
    const grouped = new Map<number, number>();
    items.forEach((item) => {
      grouped.set(
        item.productId,
        (grouped.get(item.productId) ?? 0) + item.quantity,
      );
    });
    return grouped;
  }

  private groupTransferQuantityByProduct(
    items: TransferItem[],
  ): Map<number, number> {
    const grouped = new Map<number, number>();
    items.forEach((item) => {
      grouped.set(
        item.productId,
        (grouped.get(item.productId) ?? 0) + item.quantity,
      );
    });
    return grouped;
  }

  private async validateStockLevels(
    groupedItems: Map<number, number>,
    originWarehouseId: number,
  ): Promise<void> {
    for (const [productId, quantity] of groupedItems.entries()) {
      const stockLevel = await this.inventoryService.getStockLevel(
        productId,
        originWarehouseId,
      );
      if (stockLevel < quantity) {
        throw new ConflictException(
          `Stock insuficiente para el producto ${productId}. Disponible: ${stockLevel}, requerido: ${quantity}.`,
        );
      }
    }
  }

  private toInventoryItems(
    groupedItems: Map<number, number>,
    warehouseId: number,
    headquartersId: string,
  ): Array<{
    productId: number;
    warehouseId: number;
    sedeId: number;
    quantity: number;
  }> {
    const sedeId = this.parseHeadquartersId(headquartersId);
    return Array.from(groupedItems.entries()).map(([productId, quantity]) => ({
      productId,
      warehouseId,
      sedeId,
      quantity,
    }));
  }

  private parseHeadquartersId(headquartersId: string): number {
    const parsed = Number(String(headquartersId).trim());
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `La sede ${headquartersId} no es valida para registrar movimiento de inventario.`,
      );
    }
    return parsed;
  }

  private async notifyStatusToBothHeadquarters(
    transfer: Transfer,
    status: TransferStatus,
    reason?: string,
  ): Promise<void> {
    const payload = await this.buildRealtimeTransferPayload(transfer, {
      status,
      reason,
    });

    const originHeadquartersId = String(
      transfer.originHeadquartersId ?? '',
    ).trim();
    const destinationHeadquartersId = String(
      transfer.destinationHeadquartersId ?? '',
    ).trim();

    this.transferGateway.notifyStatusChange(originHeadquartersId, payload);

    if (
      destinationHeadquartersId &&
      destinationHeadquartersId !== originHeadquartersId
    ) {
      this.transferGateway.notifyStatusChange(
        destinationHeadquartersId,
        payload,
      );
    }
  }

  private async buildRealtimeTransferPayload(
    transfer: Transfer,
    overrides?: Partial<TransferGatewayTransferPayload>,
  ): Promise<TransferGatewayTransferPayload> {
    const mapped = await this.mapTransferToListResponse(
      transfer,
      new Map<string, TransferLookupHeadquarterDto | null>(),
      new Map<number, TransferLookupUserDto | null>(),
      new Map<number, TransferLookupProductDto | null>(),
    );

    return {
      id: this.requireTransferId(transfer),
      status: overrides?.status ?? transfer.status,
      requestDate: this.normalizeTransferDate(transfer.requestDate),
      originHeadquartersId: String(transfer.originHeadquartersId ?? '').trim(),
      originWarehouseId: transfer.originWarehouseId,
      destinationHeadquartersId: String(
        transfer.destinationHeadquartersId ?? '',
      ).trim(),
      destinationWarehouseId: transfer.destinationWarehouseId,
      totalQuantity: transfer.totalQuantity,
      observation: transfer.observation ?? null,
      nomProducto: mapped.nomProducto,
      origin: mapped.origin,
      destination: mapped.destination,
      reason: overrides?.reason,
    };
  }

  private normalizeTransferDate(value: Date | null | undefined): string | null {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString();
  }

  private async validateWarehouseBelongsToHeadquarters(
    warehouseId: number,
    headquartersId: string,
  ): Promise<void> {
    const normalizedHeadquartersId = String(headquartersId ?? '').trim();
    const warehouse = await this.storeRepo.findOne({
      where: {
        id_almacen: warehouseId,
      },
      select: ['id_almacen', 'id_sede'],
    });

    if (!warehouse) {
      throw new NotFoundException(
        `No existe el almacen ${warehouseId} en el catalogo de almacenes.`,
      );
    }

    const tcpAssignment =
      await this.sedeAlmacenTcpProxy.findHeadquarterByWarehouseId(warehouseId);
    if (tcpAssignment?.id_sede) {
      if (tcpAssignment.id_sede !== normalizedHeadquartersId) {
        throw new BadRequestException(
          `El almacen ${warehouseId} pertenece a la sede ${tcpAssignment.id_sede}, no a ${normalizedHeadquartersId}.`,
        );
      }
      return;
    }

    if (warehouse.id_sede !== null && warehouse.id_sede !== undefined) {
      const warehouseHeadquartersId = String(warehouse.id_sede).trim();
      if (warehouseHeadquartersId === normalizedHeadquartersId) {
        return;
      }
      if (warehouseHeadquartersId) {
        throw new BadRequestException(
          `El almacen ${warehouseId} pertenece a la sede ${warehouseHeadquartersId}, no a ${normalizedHeadquartersId}.`,
        );
      }
    }

    const stockForHeadquarters = await this.stockRepo.findOne({
      where: {
        id_almacen: warehouseId,
        id_sede: normalizedHeadquartersId,
      },
      select: ['id_stock'],
    });

    if (stockForHeadquarters) {
      return;
    }

    const anyStockInWarehouse = await this.stockRepo.findOne({
      where: {
        id_almacen: warehouseId,
      },
      select: ['id_stock'],
    });

    if (anyStockInWarehouse) {
      throw new BadRequestException(
        `El almacen ${warehouseId} no pertenece a la sede ${normalizedHeadquartersId}.`,
      );
    }

    throw new BadRequestException(
      `El almacen ${warehouseId} no tiene una sede asignada valida.`,
    );
  }

  private async mapTransferToListResponse(
    transfer: Transfer,
    headquarterCache: Map<string, TransferLookupHeadquarterDto | null>,
    userCache: Map<number, TransferLookupUserDto | null>,
    productCache: Map<number, TransferLookupProductDto | null>,
  ): Promise<TransferListResponseDto> {
    const originHeadquartersId = String(
      transfer.originHeadquartersId ?? '',
    ).trim();
    const destinationHeadquartersId = String(
      transfer.destinationHeadquartersId ?? '',
    ).trim();

    let originHeadquarter = headquarterCache.get(originHeadquartersId);
    if (originHeadquarter === undefined) {
      originHeadquarter = await this.getHeadquarterById(originHeadquartersId);
      headquarterCache.set(originHeadquartersId, originHeadquarter);
    }

    let destinationHeadquarter = headquarterCache.get(
      destinationHeadquartersId,
    );
    if (destinationHeadquarter === undefined) {
      destinationHeadquarter = await this.getHeadquarterById(
        destinationHeadquartersId,
      );
      headquarterCache.set(destinationHeadquartersId, destinationHeadquarter);
    }

    let creatorUser: TransferLookupUserDto | null = null;
    const creatorUserId = Number(transfer.creatorUserId);
    if (Number.isFinite(creatorUserId) && creatorUserId > 0) {
      creatorUser = userCache.get(creatorUserId) ?? null;
      if (!userCache.has(creatorUserId)) {
        creatorUser = await this.getUserById(creatorUserId);
        userCache.set(creatorUserId, creatorUser);
      }
    }

    const firstItem = transfer.items?.[0];
    let nomProducto = '-';
    const productId = Number(firstItem?.productId);
    if (Number.isFinite(productId) && productId > 0) {
      let product = productCache.get(productId);
      if (product === undefined) {
        product = await this.getProductById(productId);
        productCache.set(productId, product);
      }

      nomProducto =
        product?.nomProducto?.trim() ||
        product?.descripcion?.trim() ||
        product?.codigo?.trim() ||
        '-';
    }

    const creatorUserResponse = this.mapUserToResponse(creatorUser);

    return {
      id: transfer.id,
      originHeadquartersId,
      originWarehouseId: transfer.originWarehouseId,
      destinationHeadquartersId,
      destinationWarehouseId: transfer.destinationWarehouseId,
      requestDate: this.normalizeTransferDate(transfer.requestDate) ?? '',
      origin: {
        id_sede: originHeadquartersId,
        nomSede:
          originHeadquarter?.nombre ?? `Sede ${originHeadquartersId || '-'}`,
      },
      destination: {
        id_sede: destinationHeadquartersId,
        nomSede:
          destinationHeadquarter?.nombre ??
          `Sede ${destinationHeadquartersId || '-'}`,
      },
      totalQuantity: transfer.totalQuantity,
      status: transfer.status,
      observation: transfer.observation,
      nomProducto,
      creatorUser: creatorUserResponse,
    };
  }

  private async mapTransfersToListResponse(
    transfers: Transfer[],
    headquarterCache: Map<string, TransferLookupHeadquarterDto | null>,
    userCache: Map<number, TransferLookupUserDto | null>,
    productCache: Map<number, TransferLookupProductDto | null>,
  ): Promise<TransferListResponseDto[]> {
    const results: TransferListResponseDto[] = [];

    for (const transfer of transfers) {
      results.push(
        await this.mapTransferToListResponse(
          transfer,
          headquarterCache,
          userCache,
          productCache,
        ),
      );
    }

    return results;
  }

  private mapUserToResponse(
    user: TransferLookupUserDto | null,
  ): TransferResponseUserDto | null {
    if (!user) {
      return null;
    }

    return {
      idUsuario: user.id_usuario,
      usuNom: user.usu_nom,
      apePat: user.ape_pat,
      apeMat: user.ape_mat,
    };
  }

  private async getWarehouseById(
    warehouseId: number,
  ): Promise<TransferLookupWarehouseDto | null> {
    if (!Number.isFinite(Number(warehouseId)) || Number(warehouseId) <= 0) {
      return null;
    }

    const warehouse = await this.storeRepo.findOne({
      where: { id_almacen: warehouseId },
      select: ['id_almacen', 'nombre'],
    });

    if (!warehouse) {
      return null;
    }

    return {
      id_almacen: warehouse.id_almacen,
      nombre: String(warehouse.nombre ?? '').trim(),
    };
  }

  private async getProductById(
    productId: number,
  ): Promise<TransferLookupProductDto | null> {
    if (!Number.isFinite(Number(productId)) || Number(productId) <= 0) {
      return null;
    }

    const rowsUnknown: unknown = await this.stockRepo.query(
      `SELECT
         p.id_producto AS id_producto,
         p.codigo AS codigo,
         p.anexo AS nom_producto,
         p.descripcion AS descripcion,
         c.id_categoria AS id_categoria,
         c.nombre AS categoria_nombre
       FROM producto p
       LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
       WHERE p.id_producto = ?
       LIMIT 1`,
      [productId],
    );

    const row = this.getFirstObjectRow(rowsUnknown);
    if (!row) {
      return null;
    }

    const resolvedProductId = this.toOptionalPositiveInteger(
      row['id_producto'],
    );
    if (!resolvedProductId) {
      return null;
    }

    const categoriaId = this.toOptionalPositiveInteger(row['id_categoria']);
    const categoriaNombre = this.toSafeString(row['categoria_nombre']);

    return {
      id_producto: resolvedProductId,
      codigo: this.toSafeString(row['codigo']),
      nomProducto: this.toSafeString(row['nom_producto']),
      descripcion: this.toSafeString(row['descripcion']),
      categoria: categoriaId
        ? {
            id_categoria: categoriaId,
            nombre: categoriaNombre,
          }
        : null,
    };
  }

  private async getUserById(
    userId: number | undefined,
  ): Promise<TransferLookupUserDto | null> {
    if (!userId || !Number.isFinite(Number(userId)) || Number(userId) <= 0) {
      return null;
    }

    const tcpUser = await this.usuarioTcpProxy.getUserById(Number(userId));
    if (tcpUser) {
      return {
        id_usuario: Number(tcpUser.id_usuario),
        usu_nom: this.toSafeString(tcpUser.usu_nom),
        ape_pat: this.toSafeString(tcpUser.ape_pat),
        ape_mat: this.toSafeString(tcpUser.ape_mat) || undefined,
      };
    }

    const adminDb = await this.resolveAdminDatabaseName();
    if (!adminDb) {
      return null;
    }

    try {
      const rowsUnknown: unknown = await this.stockRepo.query(
        `SELECT
           u.id_usuario AS id_usuario,
           COALESCE(NULLIF(TRIM(u.nombres), ''), NULLIF(TRIM(u.usu_nom), ''), '') AS usu_nom,
           COALESCE(u.ape_pat, '') AS ape_pat,
           COALESCE(u.ape_mat, '') AS ape_mat
         FROM \`${adminDb}\`.\`usuario\` u
         WHERE u.id_usuario = ?
         LIMIT 1`,
        [userId],
      );

      const row = this.getFirstObjectRow(rowsUnknown);
      if (!row) {
        return null;
      }

      const resolvedUserId = this.toOptionalPositiveInteger(row['id_usuario']);
      if (!resolvedUserId) {
        return null;
      }

      return {
        id_usuario: resolvedUserId,
        usu_nom: this.toSafeString(row['usu_nom']),
        ape_pat: this.toSafeString(row['ape_pat']),
        ape_mat: this.toSafeString(row['ape_mat']) || undefined,
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo resolver usuario ${userId} desde DB admin: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return null;
    }
  }

  private isAdministratorRole(role: string): boolean {
    return (
      String(role ?? '')
        .trim()
        .toUpperCase() === 'ADMINISTRADOR'
    );
  }

  private shouldIncludeTransferNotification(
    transfer: Transfer,
    headquartersId: string,
  ): boolean {
    const normalizedHeadquartersId = String(headquartersId ?? '').trim();
    const originHeadquartersId = String(
      transfer.originHeadquartersId ?? '',
    ).trim();
    const destinationHeadquartersId = String(
      transfer.destinationHeadquartersId ?? '',
    ).trim();

    if (
      transfer.status === TransferStatus.REQUESTED &&
      destinationHeadquartersId === normalizedHeadquartersId
    ) {
      return true;
    }

    if (
      (transfer.status === TransferStatus.APPROVED ||
        transfer.status === TransferStatus.REJECTED) &&
      originHeadquartersId === normalizedHeadquartersId
    ) {
      return true;
    }

    return false;
  }

  private async getHeadquarterById(
    headquarterId: string,
  ): Promise<TransferLookupHeadquarterDto | null> {
    const normalizedHeadquarterId = String(headquarterId ?? '').trim();
    if (!normalizedHeadquarterId) {
      return null;
    }

    const adminDb = await this.resolveAdminDatabaseName();
    if (!adminDb) {
      return null;
    }

    try {
      const rowsUnknown: unknown = await this.stockRepo.query(
        `SELECT
           s.id_sede AS id_sede,
           s.nombre AS nombre
         FROM \`${adminDb}\`.\`sede\` s
         WHERE s.id_sede = ?
         LIMIT 1`,
        [normalizedHeadquarterId],
      );

      const row = this.getFirstObjectRow(rowsUnknown);
      if (!row) {
        return null;
      }

      const resolvedHeadquarterId =
        this.toSafeString(row['id_sede']) || normalizedHeadquarterId;

      return {
        id_sede: resolvedHeadquarterId,
        nombre: this.toSafeString(row['nombre']),
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo resolver sede ${normalizedHeadquarterId} desde DB admin: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return null;
    }
  }

  private async resolveAdminDatabaseName(): Promise<string | null> {
    if (this.resolvedAdminDatabaseName !== undefined) {
      return this.resolvedAdminDatabaseName;
    }

    const configuredDatabase = this.getAdminDatabaseName();
    if (configuredDatabase) {
      this.resolvedAdminDatabaseName = configuredDatabase;
      return configuredDatabase;
    }

    try {
      const rowsUnknown: unknown = await this.stockRepo.query(
        `SELECT t_usuario.table_schema AS table_schema
         FROM information_schema.tables t_usuario
         INNER JOIN information_schema.tables t_sede
           ON t_sede.table_schema = t_usuario.table_schema
         WHERE t_usuario.table_name = 'usuario'
           AND t_sede.table_name = 'sede'
           AND t_usuario.table_schema NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
         ORDER BY t_usuario.table_schema ASC
         LIMIT 1`,
      );

      const row = this.getFirstObjectRow(rowsUnknown);
      const schema = row ? this.toSafeString(row['table_schema']) : '';
      this.resolvedAdminDatabaseName = schema || null;
      return this.resolvedAdminDatabaseName;
    } catch (error) {
      this.logger.warn(
        `No se pudo detectar el esquema de administracion: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      this.resolvedAdminDatabaseName = null;
      return null;
    }
  }

  private getAdminDatabaseName(): string | null {
    const configuredDatabase = String(
      process.env.ADMIN_DB_DATABASE ?? '',
    ).trim();
    return configuredDatabase || null;
  }

  private getFirstObjectRow(
    rowsUnknown: unknown,
  ): Record<string, unknown> | null {
    if (!Array.isArray(rowsUnknown) || rowsUnknown.length === 0) {
      return null;
    }

    const rows = rowsUnknown as unknown[];
    const first = rows[0];
    if (!first || typeof first !== 'object' || Array.isArray(first)) {
      return null;
    }

    return first as Record<string, unknown>;
  }

  private toSafeString(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value).trim();
    }

    return '';
  }

  private toOptionalPositiveInteger(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private requireTransferId(transfer: Transfer): number {
    const transferId = transfer.id;
    if (!Number.isInteger(transferId) || transferId <= 0) {
      throw new ConflictException(
        'La transferencia no tiene un id valido para registrar movimientos.',
      );
    }

    return transferId;
  }

  private async loadPaginatedTransfers(
    page: number,
    pageSize: number,
    headquartersId: string,
  ): Promise<PaginatedTransfersResult> {
    const paginatedRepository = this.transferRepo as {
      findAllPaginated: (
        page: number,
        pageSize: number,
        headquartersId: string,
      ) => Promise<unknown>;
    };

    const resultUnknown = await paginatedRepository.findAllPaginated(
      page,
      pageSize,
      headquartersId,
    );

    if (!this.isPaginatedTransfersResult(resultUnknown)) {
      throw new ConflictException(
        'Respuesta invalida del repositorio de transferencias paginadas.',
      );
    }

    return resultUnknown;
  }

  private isPaginatedTransfersResult(
    value: unknown,
  ): value is PaginatedTransfersResult {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as {
      transfers?: unknown;
      total?: unknown;
    };
    return (
      Array.isArray(candidate.transfers) &&
      typeof candidate.total === 'number' &&
      Number.isFinite(candidate.total)
    );
  }
}
