import { CommissionReportItem } from '../../../application/dto/out/commision-report.dto-out';
import { CommissionRule } from '../../entity/commission-rule.entity';

export interface ICommissionRepositoryPortOut {
  save(rule: CommissionRule): Promise<CommissionRule>;
  findById(id: number): Promise<CommissionRule | null>;
  findAll(activeOnly: boolean): Promise<CommissionRule[]>;
  update(id: number, rule: Partial<CommissionRule>): Promise<CommissionRule>;
  delete(id: number): Promise<void>;
  findApplicableRules(
    productIds: number[],
    categoryIds: number[],
  ): Promise<CommissionRule[]>;
}
export const COMMISSION_REPOSITORY = 'COMMISSION_REPOSITORY';
export interface IQueryCommissionRepositoryPortOut {
  getAllRules();
  calculateCommissions(
    startDate: Date,
    endDate: Date,
  ): Promise<CommissionReportItem[]>;
}
