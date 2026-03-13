import {
  Transfer,
  TransferStatus,
} from '../../domain/entity/transfer-domain-entity';
import type { TransferNotificationResponseDto } from '../dto/out/transfer-notification-response.dto';

export class TransferNotificationMapper {
  static toResponseDto(
    transfer: Transfer,
    originHeadquarterName: string,
    destinationHeadquarterName: string,
  ): TransferNotificationResponseDto {
    return {
      transferId: transfer.id ?? 0,
      title: this.resolveTitle(transfer.status),
      message: this.resolveMessage(
        transfer.status,
        originHeadquarterName,
        destinationHeadquarterName,
      ),
      status: transfer.status,
    };
  }

  private static resolveTitle(status: TransferStatus): string {
    switch (status) {
      case TransferStatus.REQUESTED:
        return 'Transferencia solicitada';
      case TransferStatus.APPROVED:
        return 'Transferencia aprobada';
      case TransferStatus.REJECTED:
        return 'Transferencia rechazada';
      default:
        return 'Transferencia actualizada';
    }
  }

  private static resolveMessage(
    status: TransferStatus,
    originHeadquarterName: string,
    destinationHeadquarterName: string,
  ): string {
    switch (status) {
      case TransferStatus.REQUESTED:
        return `Se creo una transferencia desde ${originHeadquarterName} hacia ${destinationHeadquarterName}.`;
      case TransferStatus.APPROVED:
        return `Se aprobo una transferencia desde ${originHeadquarterName} hacia ${destinationHeadquarterName}.`;
      case TransferStatus.REJECTED:
        return `Se rechazo una transferencia desde ${originHeadquarterName} hacia ${destinationHeadquarterName}.`;
      default:
        return `La transferencia entre ${originHeadquarterName} y ${destinationHeadquarterName} fue actualizada.`;
    }
  }
}
