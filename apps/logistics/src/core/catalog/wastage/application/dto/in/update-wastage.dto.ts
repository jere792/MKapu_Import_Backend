import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWastageDto {
  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_tipo_merma?: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}
