import { Inject, Injectable } from '@nestjs/common';
import { ICommandCommissionRepositoryPortIn } from '../../domain/ports/in/comission-repository.port-in';
import { CommissionRule } from '../../domain/entity/commission-rule.entity';
import { CreateCommissionRuleDto } from '../dto/in/create-commission-rule.dto';
import {
  COMMISSION_REPOSITORY,
  ICommissionRepositoryPortOut,
} from '../../domain/ports/out/commission-repository.port';

@Injectable()
export class CommissionCommandService implements ICommandCommissionRepositoryPortIn {
  constructor(
    @Inject(COMMISSION_REPOSITORY)
    private readonly repository: ICommissionRepositoryPortOut,
  ) {}
  async createRule(dto: CreateCommissionRuleDto): Promise<CommissionRule> {
    const rule = new CommissionRule({
      ...dto,
      activo: true,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
    });
    return await this.repository.save(rule);
  }
  async toggleStatus(id: number, activo: boolean): Promise<CommissionRule> {
    return await this.repository.update(id, { activo });
  }
}
