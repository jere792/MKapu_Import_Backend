import { RoleWithPermissionsDomain } from '../../entity/role-permission.domain-entity';
import {
  AssignPermissionsDto,
  RemovePermissionFromRoleDto,
} from '../../../application/dto/in';
import {
  RolePermissionResponseDto,
  RoleWithPermissionsResponseDto,
  RolePermissionDeletedResponseDto,
} from '../../../application/dto/out';

export interface IRolePermissionCommandPort {
  assignPermissions(dto: AssignPermissionsDto): Promise<RoleWithPermissionsResponseDto>;
  removePermissionFromRole(dto: RemovePermissionFromRoleDto): Promise<RolePermissionDeletedResponseDto>;
  syncPermissions(roleId: number, permissionIds: number[]): Promise<RoleWithPermissionsResponseDto>;
}

export interface IRolePermissionQueryPort {
  getPermissionsByRole(roleId: number): Promise<RoleWithPermissionsResponseDto>;
  getRolesByPermission(permissionId: number): Promise<RolePermissionResponseDto[]>;
  getAllRolesWithPermissions(): Promise<RoleWithPermissionsResponseDto[]>;
}