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
  ValidationPipe,
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
  ListUserQuotesFilterDto,
  ListUserSalesFilterDto,
  RegisterUserDto,
  UpdateUserDto,
} from '../../../../application/dto/in';
import {
  UserDeletedResponseDto,
  UserListResponse,
  UserQuotesResponseDto,
  UserResponseDto,
  UserSalesResponseDto,
  UserWithAccountResponseDto,
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

  @Get()
  listUsers(@Query() filters: ListUserFilterDto): Promise<UserListResponse> {
    return this.userQueryService.listUsers(filters);
  }

  @Get('all')
  getAllUsers(): Promise<UserResponseDto[]> {
    return this.userQueryService.getAllUsers();
  }

  @Get(':id/sales')
  getUserSales(
    @Param('id', ParseIntPipe) id: number,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: ListUserSalesFilterDto,
  ): Promise<UserSalesResponseDto> {
    return this.userQueryService.getUserSales(id, filters);
  }

  @Get(':id/quotes')
  getUserQuotes(
    @Param('id', ParseIntPipe) id: number,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: ListUserQuotesFilterDto,
  ): Promise<UserQuotesResponseDto> {
    return this.userQueryService.getUserQuotes(id, filters);
  }

  @Get(':id')
  getUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto | null> {
    return this.userQueryService.getUserById(id);
  }

  @Get(':id/full')
  getUserWithAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserWithAccountResponseDto> {
    return this.userQueryService.getUserWithAccount(id);
  }

  @Get(':id/account')
  @ApiOperation({
    summary: 'Obtener datos actuales de la cuenta (nom_usu, email)',
  })
  @HttpCode(HttpStatus.OK)
  getAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccountCredentialsResponseDto> {
    return this.userQueryService.getAccountByUserId(id);
  }

  @Patch(':id/account/credentials')
  @ApiOperation({ summary: 'Cambiar credenciales de cuenta' })
  @ApiBody({ type: ChangeAccountCredentialsDto })
  @HttpCode(HttpStatus.OK)
  changeCredentials(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<ChangeAccountCredentialsDto, 'id_usuario'>,
  ): Promise<AccountCredentialsResponseDto> {
    const dto: ChangeAccountCredentialsDto = { ...body, id_usuario: id };
    return this.userCommandService.changeCredentials(dto);
  }
}
