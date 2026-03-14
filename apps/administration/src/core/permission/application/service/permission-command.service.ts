/* ============================================
   administration/src/core/permission/application/service/permission-command.service.ts
   ============================================ */

import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IPermissionCommandPort } from '../../domain/ports/in/permission-ports-in';
import { IPermissionRepositoryPort } from '../../domain/ports/out/permission-ports-out';
import {
  RegisterPermissionDto,
  UpdatePermissionDto,
  ChangePermissionStatusDto,
} from '../dto/in';
import {
  PermissionResponseDto,
  PermissionDeletedResponseDto,
} from '../dto/out';
import { PermissionMapper } from '../mapper/permission.mapper';
import { RoleWebSocketGateway } from '../../../role/infrastructure/adapters/out/role-websocket.gateway';

@Injectable()
export class PermissionCommandService implements IPermissionCommandPort {
  constructor(
    @Inject('IPermissionRepositoryPort')
    private readonly repository: IPermissionRepositoryPort,
    private readonly roleWsGateway: RoleWebSocketGateway,
  ) {}

  async registerPermission(
    dto: RegisterPermissionDto,
  ): Promise<PermissionResponseDto> {
    const existsByName = await this.repository.existsByName(dto.nombre);
    if (existsByName) {
      throw new ConflictException('Ya existe un permiso con ese nombre');
    }

    const permission = PermissionMapper.fromRegisterDto(dto);
    const savedPermission = await this.repository.save(permission);

    this.roleWsGateway.notifyRolePermissionsChanged(0);

    return PermissionMapper.toResponseDto(savedPermission);
  }

  async updatePermission(
    dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const existingPermission = await this.repository.findById(dto.id_permiso);
    if (!existingPermission) {
      throw new NotFoundException(
        `Permiso con ID ${dto.id_permiso} no encontrado`,
      );
    }

    if (dto.nombre && dto.nombre !== existingPermission.nombre) {
      const nameExists = await this.repository.existsByName(dto.nombre);
      if (nameExists) {
        throw new ConflictException(
          'El nombre ya está en uso por otro permiso',
        );
      }
    }

    const updatedPermission = PermissionMapper.fromUpdateDto(
      existingPermission,
      dto,
    );
    const savedPermission = await this.repository.update(updatedPermission);

    this.roleWsGateway.notifyRolePermissionsChanged(0);

    return PermissionMapper.toResponseDto(savedPermission);
  }

  async changePermissionStatus(
    dto: ChangePermissionStatusDto,
  ): Promise<PermissionResponseDto> {
    const existingPermission = await this.repository.findById(dto.id_permiso);
    if (!existingPermission) {
      throw new NotFoundException(
        `Permiso con ID ${dto.id_permiso} no encontrado`,
      );
    }

    const updatedPermission = PermissionMapper.withStatus(
      existingPermission,
      dto.activo,
    );
    const savedPermission = await this.repository.update(updatedPermission);

    this.roleWsGateway.notifyRolePermissionsChanged(0);

    return PermissionMapper.toResponseDto(savedPermission);
  }

  async deletePermission(id: number): Promise<PermissionDeletedResponseDto> {
    const existingPermission = await this.repository.findById(id);
    if (!existingPermission) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    await this.repository.delete(id);

    this.roleWsGateway.notifyRolePermissionsChanged(0);

    return PermissionMapper.toDeletedResponse(id);
  }
}
