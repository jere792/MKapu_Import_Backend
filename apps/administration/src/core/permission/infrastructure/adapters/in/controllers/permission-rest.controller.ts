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
  Get,
  Query,
} from '@nestjs/common';
import {
  IPermissionCommandPort,
  IPermissionQueryPort,
} from '../../../../domain/ports/in/permission-ports-in';
import { PermissionWebSocketGateway } from '../../out/permission-websocket.gateway';
import {
  ChangePermissionStatusDto,
  ListPermissionFilterDto,
  RegisterPermissionDto,
  UpdatePermissionDto,
} from '../../../../application/dto/in';
import {
  PermissionDeletedResponseDto,
  PermissionListResponse,
  PermissionResponseDto,
} from '../../../../application/dto/out';

@Controller('permissions')
export class PermissionRestController {
  constructor(
    @Inject('IPermissionQueryPort')
    private readonly permissionQueryService: IPermissionQueryPort,
    @Inject('IPermissionCommandPort')
    private readonly permissionCommandService: IPermissionCommandPort,
    private readonly permissionGateway: PermissionWebSocketGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerPermission(
    @Body() registerDto: RegisterPermissionDto,
  ): Promise<PermissionResponseDto> {
    const newPermission =
      await this.permissionCommandService.registerPermission(registerDto);
    this.permissionGateway.notifyPermissionCreated(newPermission);
    return newPermission;
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Omit<UpdatePermissionDto, 'id_permiso'>,
  ): Promise<PermissionResponseDto> {
    const fullUpdateDto: UpdatePermissionDto = {
      ...updateDto,
      id_permiso: id,
    };
    const updatedPermission =
      await this.permissionCommandService.updatePermission(fullUpdateDto);
    this.permissionGateway.notifyPermissionUpdated(updatedPermission);
    return updatedPermission;
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async changePermissionStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: { activo: boolean },
  ): Promise<PermissionResponseDto> {
    const changeStatusDto: ChangePermissionStatusDto = {
      id_permiso: id,
      activo: statusDto.activo,
    };
    const updatedPermission =
      await this.permissionCommandService.changePermissionStatus(
        changeStatusDto,
      );
    this.permissionGateway.notifyPermissionStatusChanged(updatedPermission);
    return updatedPermission;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePermission(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PermissionDeletedResponseDto> {
    const deletedPermission = await this.permissionCommandService.deletePermission(id);
    this.permissionGateway.notifyPermissionDeleted(id);
    return deletedPermission;
  }

  @Get(':id')
  async getPermission(@Param('id', ParseIntPipe) id: number) {
    return this.permissionQueryService.getPermissionById(id);
  }

  @Get()
  async listPermissions(
    @Query() filters: ListPermissionFilterDto,
  ): Promise<PermissionListResponse> {
    return this.permissionQueryService.listPermissions(filters);
  }
}
