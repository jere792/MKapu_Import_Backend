
/* ============================================
   logistics/src/core/procurement/supplier/domain/ports/in/supplier-port-in.ts
   ============================================ */

import {
  RegisterSupplierDto,
  UpdateSupplierDto,
  ChangeSupplierStatusDto,
  ListSupplierFilterDto,
} from '../../../application/dto/in';

import {
  SupplierResponseDto,
  SupplierListResponse,
  SupplierDeletedResponseDto,
} from '../../../application/dto/out';

export interface ISupplierCommandPort {
  registerSupplier(dto: RegisterSupplierDto): Promise<SupplierResponseDto>;
  updateSupplier(dto: UpdateSupplierDto): Promise<SupplierResponseDto>;
  changeSupplierStatus(dto: ChangeSupplierStatusDto): Promise<SupplierResponseDto>;
  deleteSupplier(id: number): Promise<SupplierDeletedResponseDto>;
}

export interface ISupplierQueryPort {
  listSuppliers(filters?: ListSupplierFilterDto): Promise<SupplierListResponse>;
  getSupplierById(id: number): Promise<SupplierResponseDto | null>;
  getSupplierByRuc(ruc: string): Promise<SupplierResponseDto | null>;
}
