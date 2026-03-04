import { Injectable } from '@nestjs/common';
import { IWarehouseRepository } from '../../domain/ports/out/warehouse-ports-out';
import { ListWarehousesFilterDto } from '../dto/in/list-warehouses-filter.dto';
import { WarehouseListResponse } from '../dto/out/warehouse-list-response.dto';
import { Warehouse } from '../../domain/entity/warehouse-domain-entity';

@Injectable()
export class WarehouseQueryService {
  constructor(private readonly repo: IWarehouseRepository) {}

  async listPaginated(filters: ListWarehousesFilterDto): Promise<WarehouseListResponse> {
    return this.repo.findPaginated(filters);
  }

  async getById(id: number): Promise<Warehouse | null> {
    return this.repo.findById(id);
  }

  async getByIds(ids: number[]): Promise<Warehouse[]> {
    return this.repo.findByIds(ids);
  }
}