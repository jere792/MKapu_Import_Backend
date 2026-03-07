import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository }                       from '@nestjs/typeorm';
import { Repository, In }                         from 'typeorm';

import { IRolePermissionQueryPort }      from '../../domain/ports/in/role-permission-ports-in';
import { IRolePermissionRepositoryPort } from '../../domain/ports/out/role-permission-ports-out';
import { RoleOrmEntity }                 from '../../../role/infrastructure/entity/role-orm.entity';
import { PermissionOrmEntity }           from '../../../permission/infrastructure/entity/permission-orm.entity';

import {
  RolePermissionResponseDto,
  RoleWithPermissionsResponseDto,
} from '../dto/out';
import { RolePermissionMapper } from '../mapper/role-permission.mapper';

@Injectable()
export class RolePermissionQueryService implements IRolePermissionQueryPort {
  constructor(
    @Inject('IRolePermissionRepositoryPort')
    private readonly rpRepo: IRolePermissionRepositoryPort,

    @InjectRepository(RoleOrmEntity)
    private readonly roleRepo: Repository<RoleOrmEntity>,

    @InjectRepository(PermissionOrmEntity)
    private readonly permRepo: Repository<PermissionOrmEntity>,
  ) {}

  async getPermissionsByRole(roleId: number): Promise<RoleWithPermissionsResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id_rol: roleId } });
    if (!role) throw new NotFoundException(`Rol ${roleId} no encontrado`);

    const rpList  = await this.rpRepo.findByRoleId(roleId);
    const permIds = rpList.map(r => r.id_permiso);
    const perms   = permIds.length
      ? await this.permRepo.find({ where: { id_permiso: In(permIds) } })
      : [];

    return RolePermissionMapper.ormToRoleWithPermissionsDto(role, perms);
  }

  async getRolesByPermission(permissionId: number): Promise<RolePermissionResponseDto[]> {
    const perm = await this.permRepo.findOne({ where: { id_permiso: permissionId } });
    if (!perm) throw new NotFoundException(`Permiso ${permissionId} no encontrado`);

    const rpList = await this.rpRepo.findByPermissionId(permissionId);
    return rpList.map(r => RolePermissionMapper.toResponseDto(r));
  }

  async getAllRolesWithPermissions(): Promise<RoleWithPermissionsResponseDto[]> {
    const roles = await this.roleRepo.find({ order: { id_rol: 'ASC' } });
    if (!roles.length) return [];

    const allRp = await this.rpRepo.findAll();

    const allPermIds = [...new Set(allRp.map(r => r.id_permiso))];
    const allPerms   = allPermIds.length
      ? await this.permRepo.find({ where: { id_permiso: In(allPermIds) } })
      : [];

    // Mapeo en memoria — sin más queries
    const permsMap = new Map(allPerms.map(p => [p.id_permiso, p]));
    const rpByRole = allRp.reduce((acc, rp) => {
      if (!acc.has(rp.id_rol)) acc.set(rp.id_rol, []);
      acc.get(rp.id_rol)!.push(permsMap.get(rp.id_permiso)!);
      return acc;
    }, new Map<number, PermissionOrmEntity[]>());

    return roles.map(role =>
      RolePermissionMapper.ormToRoleWithPermissionsDto(
        role,
        rpByRole.get(role.id_rol) ?? [],
      )
    );
  }
}