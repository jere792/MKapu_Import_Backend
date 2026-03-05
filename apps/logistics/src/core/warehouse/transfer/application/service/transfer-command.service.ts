import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitPortsOut } from 'apps/logistics/src/core/catalog/unit/domain/port/out/unit-ports-out';
import { UnitStatus } from 'apps/logistics/src/core/catalog/unit/domain/entity/unit-domain-entity';
import { StockOrmEntity } from '../../../inventory/infrastructure/entity/stock-orm-entity';
import { InventoryCommandService } from '../../../inventory/application/service/inventory/inventory-command.service';
import { StoreOrmEntity } from '../../../store/infrastructure/entity/store-orm.entity';
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
import {
  Transfer,
  TransferItem,
  TransferMode,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import { TransferPortsIn } from '../../domain/ports/in/transfer-ports-in';
import { TransferPortsOut } from '../../domain/ports/out/transfer-ports-out';
import { TransferWebsocketGateway } from '../../infrastructure/adapters/out/transfer-websocket.gateway';

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
    @Inject('UnitPortsOut')
    private readonly unitRepo: UnitPortsOut,
    private readonly transferGateway: TransferWebsocketGateway,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
    @InjectRepository(StoreOrmEntity)
    private readonly storeRepo: Repository<StoreOrmEntity>,
    private readonly inventoryService: InventoryCommandService,
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

    if (transferMode === TransferMode.SERIALIZED) {
      await this.validateSerializedUnits(
        normalizedItems,
        dto.originWarehouseId,
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

    const savedTransfer = await this.transferRepo.save(transfer);

    if (transferMode === TransferMode.SERIALIZED) {
      const allSeries = normalizedItems.flatMap((item) => item.series);
      await Promise.all(
        allSeries.map((serial) =>
          this.unitRepo.updateStatusBySerial(serial, UnitStatus.TRANSFERRING),
        ),
      );
    }

    this.transferGateway.notifyNewRequest(dto.destinationHeadquartersId, {
      id: savedTransfer.id,
      origin: dto.originHeadquartersId,
      date: savedTransfer.requestDate,
    });

    return savedTransfer;
  }

  async approveTransfer(
    transferId: number,
    dto: ApproveTransferDto,
  ): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }
    if (transfer.status !== TransferStatus.REQUESTED) {
      throw new ConflictException(
        'Solo se pueden aprobar transferencias en estado SOLICITADA.',
      );
    }

    const groupedItems = this.groupTransferQuantityByProduct(transfer.items);
    await this.validateStockLevels(groupedItems, transfer.originWarehouseId);
    if (transfer.mode === TransferMode.SERIALIZED) {
      await this.validateTransferSeriesBeforeApproval(transfer);
    }

    transfer.approve();
    const transferDocId = this.requireTransferId(transfer);

    await this.inventoryService.registerExit({
      refId: transferDocId,
      refTable: 'transferencia',
      observation: `Salida por transferencia #${transferDocId} (Aprobado por usuario ${dto.userId})`,
      items: this.toInventoryItems(
        groupedItems,
        transfer.originWarehouseId,
        transfer.originHeadquartersId,
      ),
    });

    const savedTransfer = await this.transferRepo.save(transfer);
    this.notifyStatusToBothHeadquarters(savedTransfer, TransferStatus.APPROVED);
    return savedTransfer;
  }

  async confirmReceipt(
    transferId: number,
    dto: ConfirmReceiptTransferDto,
  ): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }
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
          ),
        ),
      );
    }

    const groupedItems = this.groupTransferQuantityByProduct(transfer.items);
    const transferDocId = this.requireTransferId(transfer);
    await this.inventoryService.registerIncome({
      refId: transferDocId,
      refTable: 'transferencia',
      observation: `Ingreso por transferencia #${transferDocId} (Confirmado por usuario ${dto.userId})`,
      items: this.toInventoryItems(
        groupedItems,
        transfer.destinationWarehouseId,
        transfer.destinationHeadquartersId,
      ),
    });

    transfer.complete();
    transfer.approveUserId = dto.userId;

    const savedTransfer = await this.transferRepo.save(transfer);
    this.notifyStatusToBothHeadquarters(
      savedTransfer,
      TransferStatus.COMPLETED,
    );
    return savedTransfer;
  }

  async rejectTransfer(
    transferId: number,
    dto: RejectTransferDto,
  ): Promise<Transfer> {
    const transfer = await this.transferRepo.findById(transferId);
    if (!transfer) {
      throw new NotFoundException('Transferencia no encontrada');
    }
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
      const groupedItems = this.groupTransferQuantityByProduct(transfer.items);
      const transferDocId = this.requireTransferId(transfer);
      await this.inventoryService.registerIncome({
        refId: transferDocId,
        refTable: 'transferencia',
        observation: `Reversion de salida por rechazo de transferencia #${transferDocId} (Usuario ${dto.userId})`,
        items: this.toInventoryItems(
          groupedItems,
          transfer.originWarehouseId,
          transfer.originHeadquartersId,
        ),
      });
    }

    transfer.reject(dto.reason);
    transfer.approveUserId = dto.userId;

    if (transfer.mode === TransferMode.SERIALIZED) {
      const allSeries = transfer.items.flatMap((item) => item.series);
      await Promise.all(
        allSeries.map((serial) =>
          this.unitRepo.updateStatusBySerial(serial, UnitStatus.AVAILABLE),
        ),
      );
    }

    const savedTransfer = await this.transferRepo.save(transfer);
    this.notifyStatusToBothHeadquarters(
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
          `Almacén ${String(transfer.originWarehouseId)}`,
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
          `Almacén ${String(transfer.destinationWarehouseId)}`,
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
  ): Promise<void> {
    const allSeries = items.flatMap((item) => item.series);
    if (allSeries.length === 0) {
      return;
    }

    const units = (await this.unitRepo.findBySerials(
      allSeries,
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
  ): Promise<void> {
    const allSeries = transfer.items.flatMap((item) => item.series);
    if (allSeries.length === 0) {
      return;
    }

    const units = (await this.unitRepo.findBySerials(
      allSeries,
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

  private notifyStatusToBothHeadquarters(
    transfer: Transfer,
    status: TransferStatus,
    reason?: string,
  ): void {
    const payload = {
      id: transfer.id,
      status,
      reason,
    };
    this.transferGateway.notifyStatusChange(
      transfer.originHeadquartersId,
      payload,
    );
    this.transferGateway.notifyStatusChange(
      transfer.destinationHeadquartersId,
      payload,
    );
  }

  private async validateWarehouseBelongsToHeadquarters(
    warehouseId: number,
    headquartersId: string,
  ): Promise<void> {
    const warehouse = await this.storeRepo.findOne({
      where: {
        id_almacen: warehouseId,
      },
    });

    if (!warehouse) {
      throw new NotFoundException(
        `No existe el almacen ${warehouseId} en el catalogo de almacenes.`,
      );
    }

    const stockForHeadquarters = await this.stockRepo.findOne({
      where: {
        id_almacen: warehouseId,
        id_sede: String(headquartersId).trim(),
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
        `El almacen ${warehouseId} no pertenece a la sede ${headquartersId}.`,
      );
    }
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