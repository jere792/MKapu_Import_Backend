/* eslint-disable @typescript-eslint/no-unsafe-return */
/* auth/src/core/infrastructure/controllers/auth.controller.ts */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginResponseDto } from '../../application/dto/out/LoginResponseDto';
import { LoginDto } from '../../application/dto/in/loginDto';
import { AuthService } from '../../application/service/auth-service';
import { CreateAccountDto } from '../../application/dto/in/createAccountDto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }
  @Post('create-account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear credenciales para un usuario existente' })
  @ApiResponse({ status: 201, description: 'Cuenta creada exitosamente' })
  @ApiResponse({ status: 409, description: 'El username ya existe' })
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.authService.createAccountForUser(
      dto.userId,
      dto.username,
      dto.password,
    );
  }
}
