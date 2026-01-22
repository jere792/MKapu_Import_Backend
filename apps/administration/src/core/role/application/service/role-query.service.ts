/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* ============================================
   administration/src/core/role/application/service/role-query.service.ts
   ============================================ */

import { Inject, Injectable } from '@nestjs/common';
import { IRoleQueryPort } from '../../domain/ports/in/role-port-in';
import { IRoleRepositoryPort } from '../../domain/ports/out/role-port-out';
import { ListRoleFilterDto } from '../dto/in';
import { RoleResponseDto, RoleListResponse } from '../dto/out';
import { RoleMapper } from '../mapper/role.mapper';

@Injectable()
export class RoleQueryService implements IRoleQueryPort {
  constructor(
    @Inject('IRoleRepositoryPort')
    private readonly repository: IRoleRepositoryPort,
  ) {}

  async listRoles(filters?: ListRoleFilterDto): Promise<RoleListResponse> {
    const roles = await this.repository.findAll(filters);
    return RoleMapper.toListResponse(roles);
  }

  async getRoleById(id: number): Promise<RoleResponseDto | null> {
    const role = await this.repository.findById(id);
    if (!role) {
      return null;
    }
    return RoleMapper.toResponseDto(role);
  }

  async getRoleByName(nombre: string): Promise<RoleResponseDto | null> {
    const role = await this.repository.findByName(nombre);
    if (!role) {
      return null;
    }
    return RoleMapper.toResponseDto(role);
  }
}
