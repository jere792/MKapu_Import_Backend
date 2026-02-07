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
  UseGuards,
  Get,
} from '@nestjs/common';
import { IRoleCommandPort } from '../../../../domain/ports/in/role-port-in';
import {
  RegisterRoleDto,
  UpdateRoleDto,
  ChangeRoleStatusDto,
} from '../../../../application/dto/in';
import {
  RoleResponseDto,
  RoleDeletedResponseDto,
} from '../../../../application/dto/out';
import { Roles } from 'libs/common/src/infrastructure/decorators/roles.decorators';
import { RoleGuard } from 'libs/common/src/infrastructure/guard/roles.guard';
@Controller('roles')
//@UseGuards(RoleGuard)
//@Roles('Administrador')
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

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllRoles(): Promise<RoleResponseDto[]> {
    return this.roleCommandService.getAllRoles();
  }
}
