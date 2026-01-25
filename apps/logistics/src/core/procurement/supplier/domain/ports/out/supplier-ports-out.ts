
/* ============================================
   logistics/src/core/procurement/supplier/domain/ports/out/supplier-port-out.ts
   ============================================ */

import { Supplier } from '../../entity/supplier-domain-entity';

export interface ISupplierRepositoryPort {
  save(supplier: Supplier): Promise<Supplier>;
  update(supplier: Supplier): Promise<Supplier>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<Supplier | null>;
  findByRuc(ruc: string): Promise<Supplier | null>;
  findAll(filters?: {
    estado?: boolean;
    search?: string;
  }): Promise<Supplier[]>;
  existsByRuc(ruc: string): Promise<boolean>;
}
