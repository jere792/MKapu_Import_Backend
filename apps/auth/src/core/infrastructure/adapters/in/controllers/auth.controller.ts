/* eslint-disable prettier/prettier */
/* auth/src/core/infrastructure/controllers/auth.controller.ts */
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAccountDto } from 'apps/auth/src/core/application/dto/in/createAccountDto';
import { LoginDto } from 'apps/auth/src/core/application/dto/in/loginDto';
import { AccountUserResponseDto } from 'apps/auth/src/core/application/dto/out/AccountUserResponseDto';
import { LoginResponseDto } from 'apps/auth/src/core/application/dto/out/LoginResponseDto';
import { AuthService } from 'apps/auth/src/core/application/service/auth-service';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';


@ApiTags('Auth')
@Controller()
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
  
  //@UseGuards(RoleGuard)
  //@Roles('Administrador')
  @Post('create-account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear credenciales para un usuario existente' })
  @ApiResponse({ status: 201, description: 'Cuenta creada exitosamente' })
  @ApiResponse({ status: 409, description: 'El username ya existe' })
  async createAccount(@Body() dto: CreateAccountDto): Promise<AccountUserResponseDto> {
    return this.authService.createAccountForUser(
      dto.userId,
      dto.username,
      dto.password,
      dto.roleId,
    );
  }
}
