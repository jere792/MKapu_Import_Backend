import { CreateCommissionRuleDto } from '../../../application/dto/in/create-commission-rule.dto';
import { CommissionRule } from '../../entity/commission-rule.entity';

export interface ICommandCommissionRepositoryPortIn {
  createRule(dto: CreateCommissionRuleDto): Promise<CommissionRule>;
  toggleStatus(id: number, isActive: boolean): Promise<CommissionRule>;
}
export interface IQueryCommissionRepositoryPortIn {
  getAllRules();
  calculateCommissions(startDate: Date, endDate: Date);
}
