import { Wastage } from '../../entity/wastage-domain-intity';

export interface IWastageRepositoryPort {
  save(domain: Wastage): Promise<Wastage>;
  update(id: number, payload: { motivo?: string; id_tipo_merma?: number }): Promise<Wastage>;
  findById(id: number): Promise<Wastage | null>;
  findAll(): Promise<Wastage[]>;
  findAndCount(skip: number, take: number, id_sede?: number): Promise<[Wastage[], number]>;
  searchSuggestions(q: string, id_sede?: number, limit?: number): Promise<Wastage[]>;
}

