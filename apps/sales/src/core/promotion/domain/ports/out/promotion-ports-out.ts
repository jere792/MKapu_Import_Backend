import { PromotionDomainEntity } from '../../entity/promotion-domain-entity';

export interface IPromotionRepositoryPort {
  findAll(
    page?: number,
    limit?: number,
    search?: string,
  ): Promise<[PromotionDomainEntity[], number]>;
  findById(id: number): Promise<PromotionDomainEntity | null>;
  findActive(): Promise<PromotionDomainEntity[]>;
  findCategoryNamesByIds(ids: number[]): Promise<Map<number, string>>;
  save(promotion: PromotionDomainEntity): Promise<PromotionDomainEntity>;
  update(
    id: number,
    promotion: PromotionDomainEntity,
  ): Promise<PromotionDomainEntity>;
  delete(id: number): Promise<void>;
  changeStatus(id: number, active: boolean): Promise<PromotionDomainEntity>;
}
