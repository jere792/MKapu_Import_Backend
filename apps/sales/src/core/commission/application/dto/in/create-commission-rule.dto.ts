import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import {
  CommissionRewardType,
  CommissionTargetType,
} from '../../../domain/entity/commission-rule.entity';
// Asegúrate de importar los Enums correctos de tu entidad de dominio

export class CreateCommissionRuleDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(CommissionTargetType, {
    message: `tipo_objetivo debe ser uno de: ${Object.values(CommissionTargetType).join(', ')}`,
  })
  tipo_objetivo: CommissionTargetType;

  @IsNumber()
  id_objetivo: number;

  @IsNumber()
  @Min(1)
  meta_unidades: number;

  @IsEnum(CommissionRewardType, {
    message: `tipo_recompensa debe ser uno de: ${Object.values(CommissionRewardType).join(', ')}`,
  })
  tipo_recompensa: CommissionRewardType;

  @IsNumber()
  valor_recompensa: number;

  @IsDateString()
  fecha_inicio: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;
}
