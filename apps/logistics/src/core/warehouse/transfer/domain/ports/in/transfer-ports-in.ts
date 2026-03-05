import { ApproveTransferDto } from '../../../application/dto/in/approve-transfer.dto';
import { ConfirmReceiptTransferDto } from '../../../application/dto/in/confirm-receipt-transfer.dto';
import { ListTransferQueryDto } from '../../../application/dto/in/list-transfer-query.dto';
import { RejectTransferDto } from '../../../application/dto/in/reject-transfer.dto';
import { RequestTransferDto } from '../../../application/dto/in/request-transfer.dto';
import {
  TransferByIdResponseDto,
  TransferListPaginatedResponseDto,
} from '../../../application/dto/out';
import { Transfer } from '../../entity/transfer-domain-entity';

export interface TransferPortsIn {
  requestTransfer(dto: RequestTransferDto): Promise<Transfer>;

  approveTransfer(
    transferId: number,
    dto: ApproveTransferDto,
  ): Promise<Transfer>;

  rejectTransfer(transferId: number, dto: RejectTransferDto): Promise<Transfer>;

  confirmReceipt(
    transferId: number,
    dto: ConfirmReceiptTransferDto,
  ): Promise<Transfer>;

  getTransfersByHeadquarters(headquartersId: string): Promise<Transfer[]>;

  getTransferById(id: number): Promise<TransferByIdResponseDto>;

  getAllTransfers(
    query: ListTransferQueryDto,
  ): Promise<TransferListPaginatedResponseDto>;
}
