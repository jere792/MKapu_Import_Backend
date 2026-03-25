import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  normalizePromotionConcept,
  PROMOTION_CONCEPT_MESSAGE,
  PROMOTION_CONCEPT_PATTERN,
} from '../../validation/promotion-concept.validation';

class UpdatePromotionRuleDto {
  @IsOptional()
  @IsNumber()
  idRegla?: number;

  @IsString()
  tipoCondicion: string;

  @IsString()
  valorCondicion: string;
}

class UpdateDiscountAppliedDto {
  @IsOptional()
  @IsNumber()
  idDescuento?: number;

  @IsNumber()
  monto: number;
}

export class UpdatePromotionDto {
  @IsOptional()
  @Transform(normalizePromotionConcept)
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(PROMOTION_CONCEPT_PATTERN, { message: PROMOTION_CONCEPT_MESSAGE })
  concepto?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsNumber()
  valor?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdatePromotionRuleDto)
  reglas?: UpdatePromotionRuleDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateDiscountAppliedDto)
  descuentosAplicados?: UpdateDiscountAppliedDto[];
}
