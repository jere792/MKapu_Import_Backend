import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, Inject,
} from '@nestjs/common';
import {
  IRolePermissionCommandPort,
  IRolePermissionQueryPort,
} from '../../../../domain/ports/in/role-permission-ports-in';
import {
  AssignPermissionsDto,
  RemovePermissionFromRoleDto,
  SyncPermissionsDto,
} from '../../../../application/dto/in';

@Controller('role-permissions')
export class RolePermissionRestController {
  constructor(
    @Inject('IRolePermissionCommandPort')
    private readonly cmd: IRolePermissionCommandPort,
    @Inject('IRolePermissionQueryPort')
    private readonly qry: IRolePermissionQueryPort,
  ) {}

  // ── QUERIES ───────────────────────────────────────────────────────

  /** GET /role-permissions — todos los roles con sus permisos */
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllRolesWithPermissions() {
    return this.qry.getAllRolesWithPermissions();
  }

  /** GET /role-permissions/role/:roleId — permisos de un rol */
  @Get('role/:roleId')
  @HttpCode(HttpStatus.OK)
  getPermissionsByRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.qry.getPermissionsByRole(roleId);
  }

  /** GET /role-permissions/permission/:permId — roles que tienen un permiso */
  @Get('permission/:permId')
  @HttpCode(HttpStatus.OK)
  getRolesByPermission(@Param('permId', ParseIntPipe) permId: number) {
    return this.qry.getRolesByPermission(permId);
  }

  // ── COMMANDS ──────────────────────────────────────────────────────

  /** POST /role-permissions/assign — asignar permisos (agrega sin borrar) */
  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  assignPermissions(@Body() dto: AssignPermissionsDto) {
    return this.cmd.assignPermissions(dto);
  }

  /** PATCH /role-permissions/sync — sync completo (reemplaza todos) */
  @Patch('sync')
  @HttpCode(HttpStatus.OK)
  syncPermissions(@Body() dto: SyncPermissionsDto) {
    return this.cmd.syncPermissions(dto.roleId, dto.permissionIds);
  }

  /** DELETE /role-permissions/remove — quitar un permiso de un rol */
  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  removePermission(@Body() dto: RemovePermissionFromRoleDto) {
    return this.cmd.removePermissionFromRole(dto);
  }
}