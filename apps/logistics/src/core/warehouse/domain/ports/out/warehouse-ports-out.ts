import { Warehouse } from '../../../domain/entity/warehouse-domain-entity';
import { ListWarehousesFilterDto } from '../../../application/dto/in/list-warehouses-filter.dto';
import { WarehouseListResponse } from '../../../application/dto/out/warehouse-list-response.dto';

export abstract class IWarehouseRepository {
  abstract findPaginated(filters: ListWarehousesFilterDto): Promise<WarehouseListResponse>;
  abstract findById(id: number): Promise<Warehouse | null>;
  abstract findByIds(ids: number[]): Promise<Warehouse[]>;
  abstract findByCode(code: string): Promise<Warehouse | null>;
  abstract create(w: Warehouse): Promise<Warehouse>;
  abstract update(id: number, partial: Partial<Warehouse>): Promise<Warehouse>;
  abstract delete(id: number): Promise<void>;
}