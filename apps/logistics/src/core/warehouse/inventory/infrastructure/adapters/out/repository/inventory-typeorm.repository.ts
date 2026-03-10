/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { IInventoryRepositoryPort } from '../../../../domain/ports/out/inventory-movement-ports-out';
import { InventoryMovement } from '../../../../domain/entity/inventory-movement.entity';
import { Stock } from '../../../../domain/entity/stock-domain-entity';
import { InventoryMovementOrmEntity } from '../../../entity/inventory-movement-orm.entity';
import { StockOrmEntity } from '../../../entity/stock-orm-entity';

@Injectable()
export class InventoryTypeOrmRepository implements IInventoryRepositoryPort {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly movementRepo: Repository<InventoryMovementOrmEntity>,
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
  ) {}

  async saveMovement(
    movement: InventoryMovement,
    manager?: EntityManager,
  ): Promise<void> {
    const movementRepository = manager
      ? manager.getRepository(InventoryMovementOrmEntity)
      : this.movementRepo;

    const movementOrm = movementRepository.create({
      originType: movement.originType,
      refId: movement.refId,
      refTable: movement.refTable,
      observation: movement.observation,
      date: movement.date,
      details: movement.items.map((item) => ({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        type: item.type,
      })),
    });

    // Guardar detalles dispara el trigger de la BD y actualiza stock.
    await movementRepository.save(movementOrm);
  }

  async findStock(
    productId: number,
    warehouseId: number,
  ): Promise<Stock | null> {
    const stockOrm = await this.stockRepo.findOne({
      where: { id_producto: productId, id_almacen: warehouseId },
    });

    if (!stockOrm) return null;

    return new Stock(
      stockOrm.id_stock,
      stockOrm.id_producto,
      stockOrm.id_almacen,
      stockOrm.id_sede,
      stockOrm.cantidad,
      stockOrm.tipo_ubicacion,
      stockOrm.estado,
    );
  }

  async updateStock(stock: Stock): Promise<void> {
    await this.stockRepo.update(stock.id, { cantidad: stock.quantity });
  }

  async findAllMovements(filters: any): Promise<[any[], number]> {
    const page  = Number(filters.page  ?? 1);
    const limit = Number(filters.limit ?? 10);
    const skip  = (page - 1) * limit;

    const query = this.movementRepo
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.details', 'det')
      .leftJoin('det.productRelation', 'prod')
      .addSelect([
        'prod.id_producto',
        'prod.codigo',
        'prod.descripcion',
        'prod.uni_med',
      ])
      .leftJoinAndSelect('det.warehouseRelation', 'wh')
      .orderBy('mov.date', 'DESC');

    if (filters.search) {
      query.andWhere(
        '(mov.observation LIKE :search OR mov.refTable LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.tipoId && filters.tipoId > 0) {
      if (filters.tipoId == 1) {
        query.andWhere('det.type = :type', { type: 'INGRESO' });
      } else if (filters.tipoId == 2) {
        query.andWhere('det.type = :type', { type: 'SALIDA' });
      } else if (filters.tipoId == 3) {
        query.andWhere('mov.originType = :otype', { otype: 'TRANSFERENCIA' });
      }
    }

    if (filters.fechaInicio && filters.fechaFin) {
      query.andWhere('mov.date BETWEEN :inicio AND :fin', {
        inicio: filters.fechaInicio,
        fin: filters.fechaFin,
      });
    }

    if (filters.sedeId) {
      query.andWhere(
        `EXISTS (
          SELECT 1 FROM detalle_movimiento_inventario subDet
          INNER JOIN almacen subWh ON subWh.id_almacen = subDet.id_almacen
          WHERE subDet.id_movimiento = mov.id_movimiento AND subWh.id_sede = :sedeId
        )`,
        { sedeId: Number(filters.sedeId) },
      );
    }

    query.skip(skip).take(limit);

    return await query.getManyAndCount();
  }

}
