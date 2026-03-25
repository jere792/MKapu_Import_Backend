import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPromotionQueryPort } from '../../domain/ports/in/promotion-ports-in';
import { IPromotionRepositoryPort } from '../../domain/ports/out/promotion-ports-out';
import { PromotionMapper } from '../mapper/promotion.mapper';
import { PromotionDetailDto, PromotionDto, PromotionPagedDto } from '../dto/out';
import { ListPromotionFilterDto } from '../dto/in';
import { PromotionDomainEntity } from '../../domain/entity/promotion-domain-entity';

@Injectable()
export class PromotionQueryService implements IPromotionQueryPort {
  constructor(
    @Inject('IPromotionRepositoryPort')
    private readonly repository: IPromotionRepositoryPort,
  ) {}

  async listPromotions(
    filters: ListPromotionFilterDto = {},
  ): Promise<PromotionPagedDto> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const search = filters.search?.trim();

    const [promotions, total] = await this.repository.findAll(page, limit, search);

    return PromotionMapper.toPagedDto(promotions, total, page, limit);
  }

  async getPromotionById(id: number): Promise<PromotionDto | null> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new NotFoundException(`Promoci??n con ID ${id} no encontrada`);
    }
    return PromotionMapper.toResponseDto(promotion);
  }

  async getPromotionDetailById(id: number): Promise<PromotionDetailDto | null> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new NotFoundException(`Promoci??n con ID ${id} no encontrada`);
    }

    const categoryIds = this.extractCategoryIds(promotion);
    const categoryNames = await this.repository.findCategoryNamesByIds(categoryIds);

    return PromotionMapper.toDetailDto(promotion, categoryNames);
  }

  async getActivePromotions(): Promise<PromotionDto[]> {
    const promotions = await this.repository.findActive();
    return PromotionMapper.toDtoList(promotions);
  }

  private extractCategoryIds(promotion: PromotionDomainEntity): number[] {
    return (promotion.reglas ?? [])
      .filter((rule) => rule.tipoCondicion === 'CATEGORIA')
      .map((rule) => Number(rule.valorCondicion))
      .filter(
        (categoryId): categoryId is number =>
          Number.isInteger(categoryId) && categoryId > 0,
      );
  }
}
