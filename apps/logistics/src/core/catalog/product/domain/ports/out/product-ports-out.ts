/* ============================================
   logistics/src/core/catalog/product/domain/ports/out/product-port-out.ts
   ============================================ */

import { Product } from '../../entity/product-domain-entity';
import { ListProductFilterDto } from '../../../application/dto/in';

export interface IProductRepositoryPort {
  // Commands
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: number): Promise<void>;

  // Queries
  findById(id: number): Promise<Product | null>;
  findByCode(codigo: string): Promise<Product | null>;
  findByCategory(id_categoria: number): Promise<Product[]>;
  
  findAll(filters?: ListProductFilterDto): Promise<[Product[], number]>;
  existsByCode(codigo: string): Promise<boolean>;
}