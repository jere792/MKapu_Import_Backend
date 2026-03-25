import {
  CreatePromotionDto,
  UpdatePromotionDto,
  ChangePromotionStatusDto,
  ListPromotionFilterDto,
} from '../../../application/dto/in';
import {
  PromotionDetailDto,
  PromotionPagedDto,
  PromotionDto,
} from '../../../application/dto/out';

export interface IPromotionCommandPort {
  registerPromotion(dto: CreatePromotionDto): Promise<PromotionDto>;
  updatePromotion(id: number, dto: UpdatePromotionDto): Promise<PromotionDto>;
  changeStatus(dto: ChangePromotionStatusDto): Promise<PromotionDto>;
  deletePromotion(
    id: number,
  ): Promise<{ idPromocion: number; message: string }>;
  hardDeletePromotion(
    id: number,
  ): Promise<{ idPromocion: number; message: string }>;
}

export interface IPromotionQueryPort {
  listPromotions(filters?: ListPromotionFilterDto): Promise<PromotionPagedDto>;
  getPromotionById(id: number): Promise<PromotionDto | null>;
  getPromotionDetailById(id: number): Promise<PromotionDetailDto | null>;
  getActivePromotions(): Promise<PromotionDto[]>;
}
