// wastage.port.out.ts
import { Wastage } from '../../entity/wastage-domain-intity';

export interface IWastageRepositoryPort {
  save(domain: Wastage): Promise<Wastage>;
  findById(id: number): Promise<Wastage | null>;
  findAll(): Promise<Wastage[]>;
  findAndCount(skip: number, take: number): Promise<[Wastage[], number]>;
}