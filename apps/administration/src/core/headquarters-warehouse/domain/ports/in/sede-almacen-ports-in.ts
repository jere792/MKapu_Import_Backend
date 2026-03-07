import { AssignWarehouseToSedeDto } from '../../../application/dto/in';
import {
  SedeAlmacenListResponseDto,
  SedeAlmacenResponseDto,
} from '../../../application/dto/out';

export interface ISedeAlmacenCommandPort {
  assignWarehouseToSede(
    dto: AssignWarehouseToSedeDto,
  ): Promise<SedeAlmacenResponseDto>;
  reassignWarehouseToSede(
    dto: AssignWarehouseToSedeDto,
  ): Promise<SedeAlmacenResponseDto>;
  unassignWarehouse(id_almacen: number): Promise<void>;
}

export interface ISedeAlmacenQueryPort {
  listWarehousesBySede(id_sede: number): Promise<SedeAlmacenListResponseDto>;
  getAssignmentByWarehouse(id_almacen: number): Promise<SedeAlmacenResponseDto>;
}
