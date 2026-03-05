import { SedeAlmacen } from '../../entity/sede-almacen-domain-entity';

export interface WarehouseInfo {
  id_almacen: number;
  codigo: string;
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
}

export interface ISedeAlmacenRepositoryPort {
  save(entity: SedeAlmacen): Promise<SedeAlmacen>;
  findBySedeAndWarehouse(
    id_sede: number,
    id_almacen: number,
  ): Promise<SedeAlmacen | null>;
  findByWarehouseId(id_almacen: number): Promise<SedeAlmacen | null>;
  findBySedeId(id_sede: number): Promise<SedeAlmacen[]>;
  deleteByWarehouseId(id_almacen: number): Promise<void>;
}

export interface IWarehouseGatewayPort {
  getWarehouseById(id_almacen: number): Promise<WarehouseInfo | null>;
  getWarehousesByIds(ids: number[]): Promise<WarehouseInfo[]>;
}
