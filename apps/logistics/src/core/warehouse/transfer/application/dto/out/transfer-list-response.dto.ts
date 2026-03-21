import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';
import { TransferByIdUserResponseDto } from './transfer-by-id-response.dto';

export interface TransferListResponseDto {
  id?: number;
  originHeadquartersId: string;
  originWarehouseId: number;
  destinationHeadquartersId: string;
  destinationWarehouseId: number;
  requestDate: string;
  origin: {
    id_sede: string;
    codigo: string;
    nomSede: string;
  };
  destination: {
    id_sede: string;
    codigo: string;
    nomSede: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  nomProducto: string;
  creatorUser: TransferByIdUserResponseDto | null;
}
