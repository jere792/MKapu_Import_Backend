/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import {
  ApplyAdjustmentsDto,
  IInventoryMovementCommandPort,
  MovementRequest,
} from '../../../domain/ports/in/inventory-movement-ports-in.';
import { CreateInventoryMovementDto } from '../../dto/in/create-inventory-movement.dto';
import { IInventoryRepositoryPort } from '../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMapper } from '../../mapper/inventory.mapper';
import { InventoryMovementOrmEntity } from '../../../infrastructure/entity/inventory-movement-orm.entity';
import { ManualAdjustmentDto } from '../../dto/in/manual-adjustment.dto';
import { StockOrmEntity } from '../../../infrastructure/entity/stock-orm-entity';
import { DataSource } from 'typeorm';
import { InventoryMovementDetailOrmEntity } from '../../../infrastructure/entity/inventory-movement-detail-orm.entity';
import { BulkManualAdjustmentDto } from '../../../../application/dto/in/bulk-manual-adjustment.dto';

@Injectable()
export class InventoryCommandService implements IInventoryMovementCommandPort {
  constructor(
    @Inject('IInventoryRepositoryPort')
    private readonly repository: IInventoryRepositoryPort,
    private readonly dataSource: DataSource,
  ) {}

  async getStockLevel(productId: number, warehouseId: number): Promise<number> {
    const stock = await this.repository.findStock(productId, warehouseId);
    if (!stock) return 0;
    const statusStr = String(stock.status || stock.status || '').toUpperCase();
    const isActive =
      statusStr === '1' || statusStr === 'AVAILABLE' || statusStr === 'ACTIVO';
    return isActive ? stock.quantity : 0;
  }

  async executeMovement(dto: CreateInventoryMovementDto): Promise<void> {
    for (const item of dto.items) {
      if (item.type === 'INGRESO') {
        await this.ensureStockExists(
          item.productId,
          item.warehouseId,
          item.sedeId,
        );
      }
    }
    const movement = InventoryMapper.toDomain(dto);
    await this.repository.saveMovement(movement);
  }

  async registerIncome(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({ ...item, type: 'INGRESO' })),
    };
    await this.executeMovement(fullDto);
  }

  async registerExit(dto: MovementRequest): Promise<void> {
    const fullDto: CreateInventoryMovementDto = {
      ...dto,
      originType: dto.originType || 'TRANSFERENCIA',
      items: dto.items.map((item) => ({ ...item, type: 'SALIDA' })),
    };
    await this.executeMovement(fullDto);
  }
  async applyInventoryAdjustments(dto: ApplyAdjustmentsDto): Promise<void> {
    const sobrantesParaIngreso = [];
    const faltantesParaSalida = [];

    // 1. Clasificamos las diferencias
    for (const item of dto.adjustments) {
      if (item.difference > 0) {
        sobrantesParaIngreso.push({
          productId: item.productId,
          warehouseId: item.warehouseId,
          sedeId: item.sedeId,
          quantity: Math.abs(item.difference),
        });
      } else if (item.difference < 0) {
        faltantesParaSalida.push({
          productId: item.productId,
          warehouseId: item.warehouseId,
          sedeId: item.sedeId,
          quantity: Math.abs(item.difference),
        });
      }
    }

    if (sobrantesParaIngreso.length > 0) {
      await this.registerIncome({
        originType: 'AJUSTE',
        refId: dto.refId,
        refTable: dto.refTable,
        observation: `Sobrantes por Ajuste de ${dto.refTable} #${dto.refId}`,
        items: sobrantesParaIngreso,
      });
    }

    if (faltantesParaSalida.length > 0) {
      await this.registerExit({
        originType: 'AJUSTE',
        refId: dto.refId,
        refTable: dto.refTable,
        observation: `Faltantes por Ajuste de ${dto.refTable} #${dto.refId}`,
        items: faltantesParaSalida,
      });
    }
  }
  async manualAdjustment(dto: ManualAdjustmentDto): Promise<void> {
    if (!dto || !dto.productId || dto.quantity === undefined) {
      throw new Error('Datos de ajuste incompletos o inválidos');
    }
    console.log(
      'Procesando ajuste para producto:',
      dto.productId,
      'cantidad:',
      dto.quantity,
    );
    await this.dataSource.transaction(async (manager) => {
      // 1. Buscar el stock actual
      const stock = await manager.findOne(StockOrmEntity, {
        where: {
          id_producto: dto.productId,
          id_almacen: dto.warehouseId,
        },
      });

      if (!stock)
        throw new Error(
          'No existe registro de stock para este producto en el almacén seleccionado',
        );

      const isPositive = dto.quantity > 0;

      const movimientoCabecera = manager.create(InventoryMovementOrmEntity, {
        originType: 'AJUSTE',
        refId: dto.userId || 0,
        refTable: 'usuario',
        observation: dto.reason || 'Sin observación',
        date: new Date(),
      });
      const movimientoGuardado = await manager.save(movimientoCabecera);

      const movimientoDetalle = manager.create(
        InventoryMovementDetailOrmEntity,
        {
          movementId: movimientoGuardado.id,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          quantity: Math.abs(dto.quantity),
          type: isPositive ? 'INGRESO' : 'SALIDA',
        },
      );
      await manager.save(movimientoDetalle);

      // 4. Actualizar el Stock
      const nuevaCantidad = Number(stock.cantidad) + dto.quantity;
      if (nuevaCantidad < 0)
        throw new Error('El ajuste resultaría en un stock negativo');

      await manager.update(StockOrmEntity, stock.id_stock, {
        cantidad: nuevaCantidad,
      });
    });
  }
  async bulkManualAdjustment(dto: BulkManualAdjustmentDto): Promise<void> {
    if (!dto || !dto.items || dto.items.length === 0) {
      throw new Error('No hay productos para ajustar');
    }

    await this.dataSource.transaction(async (manager) => {
      // 1. Crear la cabecera única
      const movimientoCabecera = manager.create(InventoryMovementOrmEntity, {
        originType: 'AJUSTE',
        refId: dto.userId || 0,
        refTable: 'usuario',
        observation: dto.reason,
        date: new Date(),
      });
      const movimientoGuardado = await manager.save(movimientoCabecera);

      // 2. Iterar sobre los detalles
      for (const item of dto.items) {
        // A. Buscar el stock actual
        const stock = await manager.findOne(StockOrmEntity, {
          where: { id_producto: item.productId, id_almacen: item.warehouseId },
        });

        if (!stock) {
          throw new Error(
            `No existe stock para el producto ID: ${item.productId}`,
          );
        }

        const isPositive = item.quantity > 0;

        // B. Crear el detalle relacionándolo con la cabecera
        const movimientoDetalle = manager.create(
          InventoryMovementDetailOrmEntity,
          {
            movementId: movimientoGuardado.id, // Relacionamos con la cabecera
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: Math.abs(item.quantity),
            type: isPositive ? 'INGRESO' : 'SALIDA',
          },
        );
        await manager.save(movimientoDetalle);

        // C. Actualizar el stock
        const nuevaCantidad = Number(stock.cantidad) + item.quantity;
        if (nuevaCantidad < 0) {
          throw new Error(
            `El ajuste resultaría en un stock negativo para el producto ID: ${item.productId}`,
          );
        }

        await manager.update(StockOrmEntity, stock.id_stock, {
          cantidad: nuevaCantidad,
        });
      }
    });
  }

  private async ensureStockExists(
    productId: number,
    warehouseId: number,
    sedeId: number | string,
  ): Promise<void> {
    const stockRepo = this.dataSource.getRepository(StockOrmEntity);
    const exists = await stockRepo.findOne({
      where: {
        id_producto: productId,
        id_almacen: warehouseId,
      },
    });

    if (!exists) {
      await stockRepo.save({
        id_producto: productId,
        id_almacen: warehouseId,
        id_sede: String(sedeId),
        cantidad: 0,
        estado: '1',
        tipo_ubicacion: 'ALMACEN',
      } as any);
    }
  }
}
