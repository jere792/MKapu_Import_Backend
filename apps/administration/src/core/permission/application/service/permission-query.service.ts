
/* ============================================
   administration/src/core/permission/application/service/permission-query.service.ts
   ============================================ */

import { Inject, Injectable } from '@nestjs/common';
import { IPermissionQueryPort } from '../../domain/ports/in/permission-ports-in';
import { IPermissionRepositoryPort } from '../../domain/ports/out/permission-ports-out';
import { ListPermissionFilterDto } from '../dto/in';
import { PermissionResponseDto, PermissionListResponse } from '../dto/out';
import { PermissionMapper } from '../mapper/permission.mapper';

@Injectable()
export class PermissionQueryService implements IPermissionQueryPort {
  constructor(
    @Inject('IPermissionRepositoryPort')
    private readonly repository: IPermissionRepositoryPort,
  ) {}

  async listPermissions(filters?: ListPermissionFilterDto): Promise<PermissionResponseDto[]> {
    const permissions = await this.repository.findAll(filters);
    return permissions.map(p => PermissionMapper.toResponseDto(p));
  }

  async getPermissionById(id: number): Promise<PermissionResponseDto | null> {
    const permission = await this.repository.findById(id);
    if (!permission) {
      return null;
    }
    return PermissionMapper.toResponseDto(permission);
  }

  async getPermissionByName(nombre: string): Promise<PermissionResponseDto | null> {
    const permission = await this.repository.findByName(nombre);
    if (!permission) {
      return null;
    }
    return PermissionMapper.toResponseDto(permission);
  }
}