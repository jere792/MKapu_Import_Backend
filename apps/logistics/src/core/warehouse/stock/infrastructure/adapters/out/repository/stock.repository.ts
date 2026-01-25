import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StockMapper } from '../../../../application/mapper/stock.mapper';
import { Stock } from '../../../../domain/entity/stock-domain-intity';
import { StockPortsOut } from '../../../../domain/ports/out/stock-ports-out';
import { StockOrmEntity } from '../../../entity/stock-domain-intity';

@Injectable()
export class StockRepository implements StockPortsOut {
  constructor(
    @InjectRepository(StockOrmEntity)
    private readonly stockRepo: Repository<StockOrmEntity>,
  ) {}
  async findStock(
    productId: number,
    warehouseId: number,
    headquartersId: string,
  ): Promise<Stock | null> {
    const found = await this.stockRepo.findOne({
      where: {
        id_producto: productId,
        id_almacen: warehouseId,
        id_sede: headquartersId,
      },
    });
    return found ? StockMapper.toDomain(found) : null;
  }
  async updateQuantity(stockId: number, newQuantity: number): Promise<void> {
    await this.stockRepo.update(stockId, { cantidad: newQuantity });
  }
  async create(stock: Stock): Promise<Stock> {
    const ormEntity = StockMapper.toOrm(stock);
    const saved = await this.stockRepo.save(ormEntity);
    return StockMapper.toDomain(saved);
  }
}
