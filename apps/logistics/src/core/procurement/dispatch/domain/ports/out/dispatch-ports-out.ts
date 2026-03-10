import { Dispatch } from '../../entity/dispatch-domain-entity';

export interface DispatchPortOut {
  save(dto: Dispatch): Promise<Dispatch>;
  update(id: number, dispatch: Dispatch): Promise<Dispatch>;
  getById(id: number): Promise<Dispatch | null>;
  getAll(): Promise<Dispatch[]>;
  delete(id: number): Promise<void>;
}