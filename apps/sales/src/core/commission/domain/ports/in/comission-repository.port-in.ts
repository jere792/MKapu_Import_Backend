// src/commission/domain/ports/in/commission-repository.port-in.ts

import { CreateCommissionRuleDto } from '../../../application/dto/in/create-commission-rule.dto';
import { CommissionRule } from '../../entity/commission-rule.entity';
import { Commission } from '../../entity/commission-domain-entity';

export interface ICommandCommissionRepositoryPortIn {
  createRule(dto: CreateCommissionRuleDto): Promise<CommissionRule>;
  updateRule(id: number, dto: CreateCommissionRuleDto): Promise<CommissionRule>;
  toggleStatus(id: number, isActive: boolean): Promise<CommissionRule>;
  generateFromReceipt(payload: GenerateCommissionPayload): Promise<Commission | null>;
  annulByReceipt(id_comprobante: number): Promise<void>;
}

export interface IQueryCommissionRepositoryPortIn {
  getAllRules(): Promise<CommissionRule[]>;
  calculateCommissions(startDate: Date, endDate: Date): Promise<any[]>;
}

export interface GenerateCommissionPayload {
  id_comprobante:     number;
  id_responsable_ref: string;
  total:              number;
  fec_emision:        Date;
  items: Array<{
    productId:   number;
    categoryId?: number;
    productName: string;
    quantity:    number;
    unitPrice:   number;
    total:       number;
  }>;
}