/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* ============================================
   administration/src/core/role/infrastructure/controllers/role-rest.controller.ts
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
import { IRoleCommandPort } from '../../domain/ports/in/role-port-in';
import {
  RegisterRoleDto,
  UpdateRoleDto,
  ChangeRoleStatusDto,
} from '../../application/dto/in';
import {
  RoleResponseDto,
  RoleDeletedResponseDto,
} from '../../application/dto/out';

@Controller('roles')
export class RoleRestController {
  constructor(
    @Inject('IRoleCommandPort')
    private readonly roleCommandService: IRoleCommandPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerRole(
    @Body() registerDto: RegisterRoleDto,
  ): Promise<RoleResponseDto> {
    return this.roleCommandService.registerRole(registerDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdateRoleDto, 'id_rol'>,
  ): Promise<RoleResponseDto> {
    const fullUpdateDto: UpdateRoleDto = {
      ...updateDto,
      id_rol: id,
    };
    return this.roleCommandService.updateRole(fullUpdateDto);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changeRoleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { activo: boolean },
  ): Promise<RoleResponseDto> {
    const changeStatusDto: ChangeRoleStatusDto = {
      id_rol: id,
      activo: statusDto.activo,
    };
    return this.roleCommandService.changeRoleStatus(changeStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RoleDeletedResponseDto> {
    return this.roleCommandService.deleteRole(id);
  }
}
