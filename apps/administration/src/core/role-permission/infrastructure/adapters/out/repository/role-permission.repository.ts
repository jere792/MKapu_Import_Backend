import { Injectable }        from '@nestjs/common';
import { InjectRepository }  from '@nestjs/typeorm';
import { Repository, In }    from 'typeorm';
import { IRolePermissionRepositoryPort } from '../../../../domain/ports/out/role-permission-ports-out';
import { RolePermissionDomain }          from '../../../../domain/entity/role-permission.domain-entity';
import { RolePermissionOrmEntity }       from '../../../entity/role-permission-orm.entity';
import { RolePermissionMapper }          from '../../../../application/mapper/role-permission.mapper';

@Injectable()
export class RolePermissionRepository implements IRolePermissionRepositoryPort {
  constructor(
    @InjectRepository(RolePermissionOrmEntity)
    private readonly repo: Repository<RolePermissionOrmEntity>,
  ) {}

  async findAll(): Promise<RolePermissionOrmEntity[]> {
    return this.repo.find();
  }

  async findByRoleId(roleId: number): Promise<RolePermissionDomain[]> {
    const list = await this.repo.find({ where: { id_rol: roleId } });
    return list.map(r => RolePermissionMapper.toDomain(r));
  }

  async findByPermissionId(permId: number): Promise<RolePermissionDomain[]> {
    const list = await this.repo.find({ where: { id_permiso: permId } });
    return list.map(r => RolePermissionMapper.toDomain(r));
  }

  async findOne(roleId: number, permId: number): Promise<RolePermissionDomain | null> {
    const orm = await this.repo.findOne({
      where: { id_rol: roleId, id_permiso: permId },
    });
    return orm ? RolePermissionMapper.toDomain(orm) : null;
  }

  async assign(roleId: number, permId: number): Promise<RolePermissionDomain> {
    const entity = this.repo.create({ id_rol: roleId, id_permiso: permId });
    const saved  = await this.repo.save(entity);
    return RolePermissionMapper.toDomain(saved);
  }

  async remove(roleId: number, permId: number): Promise<void> {
    await this.repo.delete({ id_rol: roleId, id_permiso: permId });
  }

  async removeAllByRoleId(roleId: number): Promise<void> {
    await this.repo.delete({ id_rol: roleId });
  }

  async bulkAssign(roleId: number, permIds: number[]): Promise<RolePermissionDomain[]> {
    const entities = permIds.map(pid => this.repo.create({ id_rol: roleId, id_permiso: pid }));
    const saved    = await this.repo.save(entities);
    return saved.map(s => RolePermissionMapper.toDomain(s));
  }

  async sync(roleId: number, permIds: number[]): Promise<void> {
    await this.repo.delete({ id_rol: roleId });
    if (!permIds.length) return;
    const entities = permIds.map(pid => this.repo.create({ id_rol: roleId, id_permiso: pid }));
    await this.repo.save(entities);
  }
}