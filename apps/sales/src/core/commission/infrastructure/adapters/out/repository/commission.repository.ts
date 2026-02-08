/* eslint-disable @typescript-eslint/unbound-method */
import { Injectable } from '@nestjs/common';
import { ICommissionRepositoryPortOut } from '../../../../domain/ports/out/commission-repository.port';
import {
  CommissionRule,
  CommissionTargetType,
} from '../../../../domain/entity/commission-rule.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CommissionRuleOrmEntity } from '../../../entity/commission-rule-orm.entity';
import { In, Repository } from 'typeorm';
import { ComissionMapper } from '../../../../application/mapper/comission-mapper';

@Injectable()
export class CommissionRepository implements ICommissionRepositoryPortOut {
  constructor(
    @InjectRepository(CommissionRuleOrmEntity)
    private readonly repo: Repository<CommissionRuleOrmEntity>,
  ) {}
  async save(rule: CommissionRule): Promise<CommissionRule> {
    const saved = await this.repo.save(ComissionMapper.toOrm(rule));
    return ComissionMapper.toDomain(saved);
  }
  async findById(id_regla: number): Promise<CommissionRule | null> {
    const entity = await this.repo.findOne({ where: { id_regla } });
    return entity ? ComissionMapper.toDomain(entity) : null;
  }
  async findAll(activeOnly: boolean): Promise<CommissionRule[]> {
    const where = activeOnly ? { activo: true } : {};
    const entities = await this.repo.find({ where });
    return entities.map(ComissionMapper.toDomain);
  }
  async update(
    id: number,
    partial: Partial<CommissionRule>,
  ): Promise<CommissionRule> {
    await this.repo.update(id, partial);
    return this.findById(id);
  }
  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
  async findApplicableRules(
    productIds: number[],
    categoryIds: number[],
  ): Promise<CommissionRule[]> {
    return (
      await this.repo.find({
        where: [
          {
            tipo_objetivo: CommissionTargetType.PRODUCTO,
            id_objetivo: In(productIds),
            activo: true,
          },
          {
            tipo_objetivo: CommissionTargetType.CATEGORIA,
            id_objetivo: In(categoryIds),
            activo: true,
          },
        ],
      })
    ).map(ComissionMapper.toDomain);
  }
}
