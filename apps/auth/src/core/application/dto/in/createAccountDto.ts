import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MinLength } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    description: 'ID del usuario creado en Administration',
    example: 1,
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Nombre de usuario para login',
    example: 'admin_user',
  })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Contraseña inicial', example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;
}
