import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductAutocompleteVentasQueryDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Length(3, 50, { message: 'search debe tener entre 3 y 50 caracteres' })
  search: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  id_sede: number;

  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsOptional()
  @IsInt()
  @Min(1)
  id_categoria?: number;
}