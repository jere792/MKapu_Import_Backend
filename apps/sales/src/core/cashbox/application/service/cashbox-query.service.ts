/* ============================================
   administration/src/core/cashbox/application/service/cashbox-query.service.ts
   ============================================ */
import { Injectable, Inject } from '@nestjs/common';
import { ICashboxQueryPort } from '../../domain/ports/in/cashbox-ports-in';
import { ICashboxRepositoryPort } from '../../domain/ports/out/cashbox-ports-out';
import { CashboxResponseDto } from '../dto/out';
import { CashboxMapper } from '../mapper/cashbox.mapper';

@Injectable()
export class CashboxQueryService implements ICashboxQueryPort {
  constructor(
    @Inject('ICashboxRepositoryPort')
    private readonly repository: ICashboxRepositoryPort,
  ) {}

  async getById(id_caja: string): Promise<CashboxResponseDto | null> {
    const cashbox = await this.repository.findById(id_caja);
    return cashbox ? CashboxMapper.toResponseDto(cashbox) : null;
  }

  async findActiveBySede(id_sede_ref: number): Promise<CashboxResponseDto | null> {
    const cashbox = await this.repository.findActiveBySede(id_sede_ref);
    return cashbox ? CashboxMapper.toResponseDto(cashbox) : null;
  }
}