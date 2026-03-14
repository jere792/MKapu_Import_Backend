/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* auth/src/core/infrastructure/controllers/auth.controller.ts */
import { JwtAuthGuard } from '@app/common/infrastructure/guard/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Headers,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}
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
  async createAccount(
    @Body() dto: CreateAccountDto,
  ): Promise<AccountUserResponseDto> {
    return this.authService.createAccountForUser(
      dto.userId,
      dto.username,
      dto.password,
      dto.roleId,
      dto.id_sede,
    );
  }
  //@UseGuards(JwtAuthGuard)
  @Get('refresh-profile')
  async refreshProfile(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('No se envió el token de autenticación');
    }
    const token = authHeader.split(' ')[1];
    try {
      const userPayload = this.jwtService.verify(token);
      console.log('✅ Token decodificado con éxito:', userPayload);
      if (!userPayload || !userPayload.username) {
        throw new UnauthorizedException(
          'El token no es válido para este usuario',
        );
      }
      return await this.authService.refreshProfile(userPayload.username);
    } catch (error) {
      console.error('❌ Error desencriptando el token:', error.message);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
