/* auth/src/core/application/dto/in/registerDto.ts */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @IsString()
  @IsNotEmpty()
  contrasenia: string;
  @IsEmail()
  email: string;

  @IsNumber()
  id_rol: number;

  @IsString()
  rolNombre: string;

  @IsNumber()
  @IsOptional()
  id_sede: number;

  @IsNumber()
  @IsOptional()
  id_usuario: number;
}
