import { RolePermissionOrmEntity } from '../../../infrastructure/entity/role-permission-orm.entity';
import { RolePermissionDomain } from '../../entity/role-permission.domain-entity';

export interface IRolePermissionRepositoryPort {
  findByRoleId(roleId: number): Promise<RolePermissionDomain[]>;
  findByPermissionId(permId: number): Promise<RolePermissionDomain[]>;
  findOne(roleId: number, permId: number): Promise<RolePermissionDomain | null>;
  assign(roleId: number, permId: number): Promise<RolePermissionDomain>;
  remove(roleId: number, permId: number): Promise<void>;
  removeAllByRoleId(roleId: number): Promise<void>;
  bulkAssign(roleId: number, permIds: number[]): Promise<RolePermissionDomain[]>;
  sync(roleId: number, permIds: number[]): Promise<void>; 
  findAll(): Promise<RolePermissionOrmEntity[]>;
}