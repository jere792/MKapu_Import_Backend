/* ============================================
   administration/src/core/cashbox/domain/ports/in/cashbox-port-in.ts
   ============================================ */
import { OpenCashboxDto, CloseCashboxDto } from '../../../application/dto/in';
import { CashboxResponseDto } from '../../../application/dto/out';

export interface ICashboxCommandPort {
  openCashbox(dto: OpenCashboxDto): Promise<CashboxResponseDto>;
  closeCashbox(dto: CloseCashboxDto): Promise<CashboxResponseDto>;
}

export interface ICashboxQueryPort {
  getById(id_caja: string): Promise<CashboxResponseDto | null>;
  findActiveBySede(id_sede_ref: number): Promise<CashboxResponseDto | null>;
}