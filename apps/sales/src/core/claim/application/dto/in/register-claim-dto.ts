import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ClaimDetailDto {
  @ApiProperty({ example: 'Falla Técnica' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ example: 'La pantalla parpadea' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;
}

export class RegisterClaimDto {
  @ApiProperty({ description: 'ID del comprobante de venta', example: 105 })
  @IsInt()
  @IsNotEmpty()
  id_comprobante: number;

  @ApiProperty({
    description: 'ID del vendedor o usuario que registra',
    example: 'user-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  id_vendedor_ref: string;

  @ApiProperty({
    description: 'Motivo principal',
    example: 'Producto Defectuoso',
  })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsInt()
  @IsOptional()
  id_sede?: number;

  @ApiProperty({ description: 'Descripción general del reclamo' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ type: [ClaimDetailDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimDetailDto)
  detalles?: ClaimDetailDto[];
}
