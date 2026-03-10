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
  findActiveBySede(idSede: number): Promise<CashboxResponseDto | null>;
  getById(id: string): Promise<CashboxResponseDto | null>;
  getResumenDia(idSede: number): Promise<{ totalVentas: number; totalMonto: number; ticketPromedio: number } | null>; // 👈
}