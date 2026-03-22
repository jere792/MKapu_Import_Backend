import { Bank } from '../../entity/bank-domain-entity';
import { ServiceType } from '../../entity/service-type-domain-entity';


export interface IBankRepositoryPort {
  findAllBanks(): Promise<Bank[]>;
  findServiceTypes(bancoId?: number): Promise<ServiceType[]>;
}