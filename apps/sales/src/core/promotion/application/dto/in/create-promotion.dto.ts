import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  normalizePromotionConcept,
  PROMOTION_CONCEPT_MESSAGE,
  PROMOTION_CONCEPT_PATTERN,
} from '../../validation/promotion-concept.validation';

class PromotionRuleDto {
  @IsString()
  tipoCondicion: string;

  @IsString()
  valorCondicion: string;
}

class DiscountAppliedDto {
  @IsNumber()
  monto: number;

  @IsOptional()
  @IsNumber()
  idDescuento?: number;
}

export class CreatePromotionDto {
  @Transform(normalizePromotionConcept)
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(PROMOTION_CONCEPT_PATTERN, { message: PROMOTION_CONCEPT_MESSAGE })
  concepto: string;

  @IsString()
  tipo: string;

  @IsNumber()
  valor: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean = true;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  reglas?: PromotionRuleDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DiscountAppliedDto)
  descuentosAplicados?: DiscountAppliedDto[];
}
