import { Type } from 'class-transformer';
import {
  IsString,
  IsDate,
  IsEnum,
  ValidateNested,
  IsArray,
  Length,
  IsInt,
  Min,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class UpdateAuctionDetailDto {
  @IsInt()
  @Min(1)
  id_producto!: number;

  @IsNumber()
  @Min(0)
  pre_original!: number;

  @IsNumber()
  @Min(0)
  pre_remate!: number;

  @IsInt()
  @Min(0)
  stock_remate!: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class UpdateAuctionDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  descripcion?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fec_inicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fec_fin?: Date;

  @IsOptional()
  @IsEnum(['ACTIVO', 'FINALIZADO'])
  estado?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAuctionDetailDto)
  detalles?: UpdateAuctionDetailDto[];
}