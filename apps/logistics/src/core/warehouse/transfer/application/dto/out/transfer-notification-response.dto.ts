import { TransferStatus } from '../../../domain/entity/transfer-domain-entity';

export interface TransferNotificationResponseDto {
  transferId: number;
  title: string;
  message: string;
  status: TransferStatus;
}
