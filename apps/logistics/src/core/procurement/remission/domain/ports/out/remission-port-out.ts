import { Remission } from '../../entity/remission-domain-entity';

export interface RemissionPortOut {
  getNextCorrelative(): Promise<number>;
  save(remission: Remission): Promise<void>;
  findById(id: string): Promise<Remission | null>;
  findByRefId(idVenta: number): Promise<any>;
}
