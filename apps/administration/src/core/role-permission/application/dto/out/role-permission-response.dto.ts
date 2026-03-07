export class RolePermissionResponseDto {
  id_rol:     number;
  id_permiso: number;
}

export class PermissionInRoleDto {
  id_permiso:  number;
  nombre:      string;
  descripcion: string;
  activo:      boolean;
}

export class RoleWithPermissionsResponseDto {
  id_rol:      number;
  nombre:      string;
  descripcion: string | null;
  activo:      boolean;
  permisos:    PermissionInRoleDto[];
}

export class RolePermissionDeletedResponseDto {
  roleId:      number;
  permissionId: number;
  message:     string;
  deletedAt:   Date;
}