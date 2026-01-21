/* ============================================
   administration/src/core/user/infrastructure/controllers/user-rest.controller.ts
   ============================================ */

import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { IUserCommandPort } from '../../domain/ports/in/user-port-in';
import {
  RegisterUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
} from '../../application/dto/in';
import {
  UserResponseDto,
  UserDeletedResponseDto,
} from '../../application/dto/out';

@Controller('users')
export class UserRestController {
  constructor(
    @Inject('IUserCommandPort')
    private readonly userCommandService: IUserCommandPort,
  ) {}

  /**
   * POST /users - Registrar nuevo usuario
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerUser(
    @Body() registerDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    return this.userCommandService.registerUser(registerDto);
  }

  /**
   * PUT /users/:id - Actualizar usuario
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateUserDto, 'id_usuario'>,
  ): Promise<UserResponseDto> {
    const fullUpdateDto: UpdateUserDto = {
      ...updateDto,
      id_usuario: id,
    };
    return this.userCommandService.updateUser(fullUpdateDto);
  }

  /**
   * PUT /users/:id/status - Cambiar estado del usuario
   */
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
    return this.userCommandService.changeUserStatus(changeStatusDto);
  }

  /**
   * DELETE /users/:id - Eliminar usuario
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserDeletedResponseDto> {
    return this.userCommandService.deleteUser(id);
  }
}
