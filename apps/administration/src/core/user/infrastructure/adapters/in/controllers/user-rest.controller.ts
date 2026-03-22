// administration/src/core/user/infrastructure/adapters/in/controllers/user-rest.controller.ts

import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IUserCommandPort,
  IUserQueryPort,
} from '../../../../domain/ports/in/user-port-in';
import { UserWebSocketGateway } from '../../out/user-websocket.gateway';
import {
  ChangeUserStatusDto,
  ListUserFilterDto,
  RegisterUserDto,
  UpdateUserDto,
} from '../../../../application/dto/in';
import {
  UserDeletedResponseDto,
  UserListResponse,
  UserResponseDto,
} from '../../../../application/dto/out';
import { ChangeAccountCredentialsDto } from '../../../../application/dto/in/change-account-credentials-dto';
import { AccountCredentialsResponseDto } from '../../../../application/dto/out/account-credentials-response.dto';

@ApiTags('users')
@Controller('users')
export class UserRestController {
  constructor(
    @Inject('IUserQueryPort')
    private readonly userQueryService: IUserQueryPort,
    @Inject('IUserCommandPort')
    private readonly userCommandService: IUserCommandPort,
    private readonly userGateway: UserWebSocketGateway,
  ) {}

  // ─────────────────────────────────────────
  // CRUD de Usuario
  // ─────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() registerDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    const newUser = await this.userCommandService.registerUser(registerDto);
    this.userGateway.notifyUserCreated(newUser);
    return newUser;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateUserDto, 'id_usuario'>,
  ): Promise<UserResponseDto> {
    const fullUpdateDto: UpdateUserDto = { ...updateDto, id_usuario: id };
    const updatedUser = await this.userCommandService.updateUser(fullUpdateDto);
    this.userGateway.notifyUserUpdated(updatedUser);
    return updatedUser;
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { activo: boolean },
  ): Promise<UserResponseDto> {
    const changeStatusDto: ChangeUserStatusDto = {
      id_usuario: id,
      activo: statusDto.activo,
    };
    const updatedUser =
      await this.userCommandService.changeUserStatus(changeStatusDto);
    this.userGateway.notifyUserStatusChanged(updatedUser);
    return updatedUser;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserDeletedResponseDto> {
    const deletedUser = await this.userCommandService.deleteUser(id);
    this.userGateway.notifyUserDeleted(id);
    return deletedUser;
  }

  // ─────────────────────────────────────────
  // Queries de Usuario
  // ─────────────────────────────────────────

  @Get()
  async listUsers(
    @Query() filters: ListUserFilterDto,
  ): Promise<UserListResponse> {
    return this.userQueryService.listUsers(filters);
  }

  @Get('all')
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.userQueryService.getAllUsers();
  }

  @Get(':id')
  async getUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.userQueryService.getUserById(id);
  }

  @Get(':id/full')
  async getUserWithAccount(@Param('id', ParseIntPipe) id: number) {
    return this.userQueryService.getUserWithAccount(id);
  }

  // ─────────────────────────────────────────
  // Credenciales de Cuenta
  // ─────────────────────────────────────────

  @Get(':id/account')
  @ApiOperation({
    summary: 'Obtener datos actuales de la cuenta (nom_usu, email)',
  })
  @HttpCode(HttpStatus.OK)
  async getAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountCredentialsResponseDto> {
    return this.userQueryService.getAccountByUserId(id);
  }

  @Patch(':id/account/credentials')
  @ApiOperation({ summary: 'Cambiar credenciales de cuenta' })
  @ApiBody({ type: ChangeAccountCredentialsDto })
  @HttpCode(HttpStatus.OK)
  async changeCredentials(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<ChangeAccountCredentialsDto, 'id_usuario'>,
  ): Promise<AccountCredentialsResponseDto> {
    const dto: ChangeAccountCredentialsDto = { ...body, id_usuario: id };
    return this.userCommandService.changeCredentials(dto);
  }
}
