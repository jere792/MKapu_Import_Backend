

/* ============================================
   administration/src/core/role/domain/ports/in/role-port-in.ts
   ============================================ */

import {
  RegisterRoleDto,
  UpdateRoleDto,
  ChangeRoleStatusDto,
  ListRoleFilterDto,
} from '../../../application/dto/in';

import {
  RoleResponseDto,
  RoleListResponse,
  RoleDeletedResponseDto,
} from '../../../application/dto/out';

// Command Port (REST - POST, PUT, DELETE)
export interface IRoleCommandPort {
  registerRole(dto: RegisterRoleDto): Promise<RoleResponseDto>;
  updateRole(dto: UpdateRoleDto): Promise<RoleResponseDto>;
  changeRoleStatus(dto: ChangeRoleStatusDto): Promise<RoleResponseDto>;
  deleteRole(id: number): Promise<RoleDeletedResponseDto>;
  getAllRoles(): Promise<RoleResponseDto[]>;
}

// Query Port (WebSockets - GET)
export interface IRoleQueryPort {
  listRoles(filters?: ListRoleFilterDto): Promise<RoleListResponse>;
  getRoleById(id: number): Promise<RoleResponseDto | null>;
  getRoleByName(nombre: string): Promise<RoleResponseDto | null>;
}