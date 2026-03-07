import { RolePermissionOrmEntity }             from '../../infrastructure/entity/role-permission-orm.entity';
import { RoleOrmEntity }                       from '../../../role/infrastructure/entity/role-orm.entity';
import { PermissionOrmEntity }                 from '../../../permission/infrastructure/entity/permission-orm.entity';
import { RolePermissionDomain,
         RoleWithPermissionsDomain }           from '../../domain/entity/role-permission.domain-entity';
import {
  RolePermissionResponseDto,
  PermissionInRoleDto,
  RoleWithPermissionsResponseDto,
}                                              from '../dto/out';

export class RolePermissionMapper {

  // ── ORM → Domain ──────────────────────────────────────────────────
  static toDomain(orm: RolePermissionOrmEntity): RolePermissionDomain {
    return new RolePermissionDomain(orm.id_rol, orm.id_permiso);
  }

  static toRoleWithPermissionsDomain(
    role: RoleOrmEntity,
    perms: PermissionOrmEntity[],
  ): RoleWithPermissionsDomain {
    return new RoleWithPermissionsDomain(
      role.id_rol,
      role.nombre,
      role.descripcion ?? null,
      role.activo,
      perms.map(p => ({
        id_permiso:  p.id_permiso,
        nombre:      p.nombre,
        descripcion: p.descripcion,
        activo:      Boolean(p.activo),
      })),
    );
  }

  // ── Domain → DTO ──────────────────────────────────────────────────
  static toResponseDto(domain: RolePermissionDomain): RolePermissionResponseDto {
    return { id_rol: domain.id_rol, id_permiso: domain.id_permiso };
  }

  static toRoleWithPermissionsDto(
    domain: RoleWithPermissionsDomain,
  ): RoleWithPermissionsResponseDto {
    return {
      id_rol:      domain.id_rol,
      nombre:      domain.nombre,
      descripcion: domain.descripcion,
      activo:      domain.activo,
      permisos:    domain.permisos.map(p => ({
        id_permiso:  p.id_permiso,
        nombre:      p.nombre,
        descripcion: p.descripcion,
        activo:      p.activo,
      })),
    };
  }

  // ── ORM directo → DTO (para queries simples) ──────────────────────
  static ormToRoleWithPermissionsDto(
    role: RoleOrmEntity,
    perms: PermissionOrmEntity[],
  ): RoleWithPermissionsResponseDto {
    return {
      id_rol:      role.id_rol,
      nombre:      role.nombre,
      descripcion: role.descripcion ?? null,
      activo:      role.activo,
      permisos:    perms.map(p => ({
        id_permiso:  p.id_permiso,
        nombre:      p.nombre,
        descripcion: p.descripcion,
        activo:      Boolean(p.activo),
      })),
    };
  }
}