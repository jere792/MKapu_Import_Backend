import {
  Injectable, Inject,
  NotFoundException, ConflictException,BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In }   from 'typeorm';

import { IRolePermissionCommandPort }    from '../../domain/ports/in/role-permission-ports-in';
import { IRolePermissionRepositoryPort } from '../../domain/ports/out/role-permission-ports-out';
import { RoleOrmEntity }                 from '../../../role/infrastructure/entity/role-orm.entity';
import { PermissionOrmEntity }           from '../../../permission/infrastructure/entity/permission-orm.entity';
import {
  AssignPermissionsDto,
  RemovePermissionFromRoleDto,
} from '../dto/in';
import {
  RoleWithPermissionsResponseDto,
  RolePermissionDeletedResponseDto,
} from '../dto/out';
import { RolePermissionMapper } from '../mapper/role-permission.mapper';

// 👇 1. IMPORTAMOS EL GATEWAY
import { RoleWebSocketGateway } from '../../../role/infrastructure/adapters/out/role-websocket.gateway';

@Injectable()
export class RolePermissionCommandService implements IRolePermissionCommandPort {
  constructor(
    @Inject('IRolePermissionRepositoryPort')
    private readonly rpRepo: IRolePermissionRepositoryPort,

    @InjectRepository(RoleOrmEntity)
    private readonly roleRepo: Repository<RoleOrmEntity>,

    @InjectRepository(PermissionOrmEntity)
    private readonly permRepo: Repository<PermissionOrmEntity>,

    // 👇 2. INYECTAMOS EL GATEWAY
    private readonly roleWsGateway: RoleWebSocketGateway,
  ) {}

  async assignPermissions(dto: AssignPermissionsDto): Promise<RoleWithPermissionsResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id_rol: dto.roleId } });
    if (!role) throw new NotFoundException(`Rol ${dto.roleId} no encontrado`);

    const perms = await this.permRepo.find({
      where: { id_permiso: In(dto.permissionIds) },
    });
    if (perms.length !== dto.permissionIds.length) {
      const found    = perms.map(p => p.id_permiso);
      const missing  = dto.permissionIds.filter(id => !found.includes(id));
      throw new NotFoundException(`Permisos no encontrados: ${missing.join(', ')}`);
    }

    for (const permId of dto.permissionIds) {
      const existing = await this.rpRepo.findOne(dto.roleId, permId);
      if (existing) {
        throw new ConflictException(
          `El permiso ${permId} ya está asignado al rol ${dto.roleId}`,
        );
      }
    }

    await this.rpRepo.bulkAssign(dto.roleId, dto.permissionIds);

    const allPermIds = (await this.rpRepo.findByRoleId(dto.roleId)).map(r => r.id_permiso);
    const allPerms   = allPermIds.length
      ? await this.permRepo.find({ where: { id_permiso: In(allPermIds) } })
      : [];

    // 👇 3. AVISO DE ASIGNACIÓN
    this.roleWsGateway.notifyRolePermissionsChanged(dto.roleId);

    return RolePermissionMapper.ormToRoleWithPermissionsDto(role, allPerms);
  }

  async removePermissionFromRole(
    dto: RemovePermissionFromRoleDto,
  ): Promise<RolePermissionDeletedResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id_rol: dto.roleId } });
    if (!role) throw new NotFoundException(`Rol ${dto.roleId} no encontrado`);

    const perm = await this.permRepo.findOne({ where: { id_permiso: dto.permissionId } });
    if (!perm) throw new NotFoundException(`Permiso ${dto.permissionId} no encontrado`);

    const existing = await this.rpRepo.findOne(dto.roleId, dto.permissionId);
    if (!existing) {
      throw new NotFoundException(
        `El permiso ${dto.permissionId} no está asignado al rol ${dto.roleId}`,
      );
    }

    await this.rpRepo.remove(dto.roleId, dto.permissionId);

    // 👇 4. AVISO DE REMOCIÓN
    this.roleWsGateway.notifyRolePermissionsChanged(dto.roleId);

    return {
      roleId:       dto.roleId,
      permissionId: dto.permissionId,
      message:      `Permiso '${perm.nombre}' removido del rol '${role.nombre}'`,
      deletedAt:    new Date(),
    };
  }

  async syncPermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<RoleWithPermissionsResponseDto> {
    const role = await this.roleRepo.findOne({ where: { id_rol: roleId } });
    if (!role) throw new NotFoundException(`Rol ${roleId} no encontrado`);

    if (!permissionIds || permissionIds.length === 0) {
      throw new BadRequestException('El rol debe tener al menos un permiso asignado');
    }

    const perms = await this.permRepo.find({
      where: { id_permiso: In(permissionIds) },
    });
    if (perms.length !== permissionIds.length) {
      const found   = perms.map(p => p.id_permiso);
      const missing = permissionIds.filter(id => !found.includes(id));
      throw new NotFoundException(`Permisos no encontrados: ${missing.join(', ')}`);
    }

    await this.rpRepo.sync(roleId, permissionIds);

    const finalPerms = await this.permRepo.find({
      where: { id_permiso: In(permissionIds) },
    });

    // 👇 5. ¡EL AVISO CRUCIAL PARA LA SINCRONIZACIÓN (Checkboxes)!
    console.log(`📢 Emitiendo WebSocket: Sincronización de permisos para el Rol ${roleId}.`);
    this.roleWsGateway.notifyRolePermissionsChanged(roleId);

    return RolePermissionMapper.ormToRoleWithPermissionsDto(role, finalPerms);
  }
}