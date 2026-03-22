import {
  BankResponseDto,
  ServiceTypeResponseDto,
} from '../../../application/dto/out';

export interface IBankQueryPort {
  getAllBanks(): Promise<BankResponseDto[]>;
  getServiceTypes(bancoId?: number): Promise<ServiceTypeResponseDto[]>;
}