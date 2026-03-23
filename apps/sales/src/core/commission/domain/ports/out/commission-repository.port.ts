import { CommissionReportItem } from '../../../application/dto/out/commision-report.dto-out';
import { CommissionRule } from '../../entity/commission-rule.entity';
import { Commission } from '../../entity/commission-domain-entity';
import { CommissionReportFlat } from '../../../application/dto/out/commission-report-flat.dto';

export const COMMISSION_REPOSITORY = 'COMMISSION_REPOSITORY';

export interface ICommissionRepositoryPortOut {
  // ── Reglas ────────────────────────────────────────────────────────────
  // En commission-repository.port.ts — agregar a ICommissionRepositoryPortOut
  findByDateRangeWithSede(from: Date, to: Date): Promise<(Commission & { id_sede: number })[]>;  save(rule: CommissionRule): Promise<CommissionRule>;
  findById(id: number): Promise<CommissionRule | null>;
  findAll(activeOnly: boolean): Promise<CommissionRule[]>;
  update(id: number, rule: Partial<CommissionRule>): Promise<CommissionRule>;
  delete(id: number): Promise<void>;
  findApplicableRules(productIds: number[], categoryIds: number[]): Promise<CommissionRule[]>;

  // ── Comisiones individuales ───────────────────────────────────────────
  saveCommission(commission: Commission): Promise<Commission>;
  findCommissionByReceipt(id_comprobante: number): Promise<Commission | null>;
  findCommissionById(id_comision: number): Promise<Commission | null>;   // ← nuevo
  annulCommission(id_comprobante: number): Promise<void>;
  findByDateRange(from: Date, to: Date): Promise<Commission[]>;
  getUsageByRule(): Promise<{ id_regla: number; usos: number; monto_total: number }[]>;
}

export interface IQueryCommissionRepositoryPortOut {
  getAllRules(): Promise<CommissionRule[]>;
  getUsageByRule(): Promise<{ id_regla: number; usos: number; monto_total: number }[]>;
  getReport(from: Date, to: Date): Promise<CommissionReportFlat[]>;      
  calculateCommissions(startDate: Date, endDate: Date): Promise<CommissionReportItem[]>;
}