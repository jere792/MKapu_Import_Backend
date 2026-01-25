
/* ============================================
   logistics/src/core/procurement/supplier/application/service/supplier-query.service.ts
   ============================================ */

import { Inject, Injectable } from '@nestjs/common';
import { ISupplierQueryPort } from '../../domain/ports/in/supplier-ports-in';
import { ISupplierRepositoryPort } from '../../domain/ports/out/supplier-ports-out';
import { ListSupplierFilterDto } from '../dto/in';
import { SupplierResponseDto, SupplierListResponse } from '../dto/out';
import { SupplierMapper } from '../mapper/supplier.mapper';

@Injectable()
export class SupplierQueryService implements ISupplierQueryPort {
  constructor(
    @Inject('ISupplierRepositoryPort')
    private readonly repository: ISupplierRepositoryPort,
  ) {}

  async listSuppliers(filters?: ListSupplierFilterDto): Promise<SupplierListResponse> {
    const suppliers = await this.repository.findAll(filters);
    return SupplierMapper.toListResponse(suppliers);
  }

  async getSupplierById(id: number): Promise<SupplierResponseDto | null> {
    const supplier = await this.repository.findById(id);
    if (!supplier) {
      return null;
    }
    return SupplierMapper.toResponseDto(supplier);
  }

  async getSupplierByRuc(ruc: string): Promise<SupplierResponseDto | null> {
    const supplier = await this.repository.findByRuc(ruc);
    if (!supplier) {
      return null;
    }
    return SupplierMapper.toResponseDto(supplier);
  }
}