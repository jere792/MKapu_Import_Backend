import { Warranty } from '../../entity/warranty-domain';

export interface FindWarrantyFilters {
  page: number;
  limit: number;
  search?: string;
  id_estado?: number;
}

export interface IWarrantyRepositoryPort {
  save(warranty: Warranty): Promise<Warranty>;
  update(warranty: Warranty): Promise<Warranty>;
  findById(id: number): Promise<Warranty | null>;
  findByReceiptId(idComprobante: number): Promise<Warranty[]>;
  findAll(filters: FindWarrantyFilters): Promise<[Warranty[], number]>;
  addTracking(tracking: any): Promise<void>;
  delete(id: number): Promise<void>;
}
