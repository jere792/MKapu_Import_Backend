import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsEnum,
  ValidateNested,
  IsArray,
  Length,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { CreateAuctionDetailDto } from './create-auction-detail.dto';

export enum AuctionStatus {
  ACTIVO = 'ACTIVO',
  FINALIZADO = 'FINALIZADO',
}

export class CreateAuctionDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  cod_remate?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  descripcion!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fec_inicio?: Date;

  @Type(() => Date)
  @IsDate()
  fec_fin!: Date;

  @IsOptional()
  @IsEnum(AuctionStatus)
  estado?: AuctionStatus = AuctionStatus.ACTIVO;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_almacen_ref!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuctionDetailDto)
  detalles!: CreateAuctionDetailDto[];
}