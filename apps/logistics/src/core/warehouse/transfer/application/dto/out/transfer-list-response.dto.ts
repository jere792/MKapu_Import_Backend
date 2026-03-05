import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';
import { TransferByIdUserResponseDto } from './transfer-by-id-response.dto';

export interface TransferListResponseDto {
  id?: number;
  origin: {
    id_sede: string;
    nomSede: string;
  };
  destination: {
    id_sede: string;
    nomSede: string;
  };
  totalQuantity: number;
  status: TransferStatus;
  observation?: string;
  nomProducto: string;
  creatorUser: TransferByIdUserResponseDto | null;
}
