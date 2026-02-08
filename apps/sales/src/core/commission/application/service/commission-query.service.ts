/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable } from '@nestjs/common';
import {
  COMMISSION_REPOSITORY,
  ICommissionRepositoryPortOut,
  IQueryCommissionRepositoryPortOut,
} from '../../domain/ports/out/commission-repository.port';
import { ISalesReceiptQueryPort } from '../../../sales-receipt/domain/ports/in/sales_receipt-ports-in';
import { CommissionReportItem } from '../dto/out/commision-report.dto-out';
import { ReceiptStatus } from '../../../sales-receipt/domain/entity/sales-receipt-domain-entity';
import { SalesReceiptResponseDto } from '../../../sales-receipt/application/dto/out/sales-receipt-response.dto';
import {
  CommissionRewardType,
  CommissionRule,
  CommissionTargetType,
} from '../../domain/entity/commission-rule.entity';

@Injectable()
export class CommissionQueryService implements IQueryCommissionRepositoryPortOut {
  constructor(
    @Inject(COMMISSION_REPOSITORY)
    private readonly repository: ICommissionRepositoryPortOut,
    @Inject('ISalesReceiptQueryPort')
    private salesRepo: ISalesReceiptQueryPort,
  ) {}

  async getAllRules() {
    return await this.repository.findAll(false);
  }
  async calculateCommissions(
    startDate: Date,
    endDate: Date,
  ): Promise<CommissionReportItem[]> {
    const rules = await this.repository.findAll(true);
    if (!rules.length) return [];
    const salesResponse = await this.salesRepo.listReceipts({
      status: ReceiptStatus.EMITIDO,
      dateFrom: startDate,
      dateTo: endDate,
    });
    const sales: SalesReceiptResponseDto[] = salesResponse.receipts;
    const reportMap = new Map<string, CommissionReportItem>();
    for (const sale of sales) {
      const sellerId = sale.idResponsableRef;

      if (!reportMap.has(sellerId)) {
        reportMap.set(sellerId, {
          sellerId,
          totalCommission: 0,
          totalSales: 0,
          details: [],
        });
      }
      const sellerReport = reportMap.get(sellerId);
      const receiptCommissions: any[] = [];
      let receiptTotalCommission = 0;
      for (const item of sale.items) {
        const applicableRule = rules.find(
          (r) =>
            r.tipo_objetivo === CommissionTargetType.PRODUCTO &&
            r.id_objetivo === Number(item.productId) &&
            r.esVigente(new Date(sale.fecEmision)),
        );
        if (applicableRule && item.quantity >= applicableRule.meta_unidades) {
          const commissionAmount = this.calculateItemCommission(
            item,
            applicableRule,
          );

          if (commissionAmount > 0) {
            receiptTotalCommission += commissionAmount;
            receiptCommissions.push({
              productName: item.productName,
              quantity: item.quantity,
              commissionEarned: Number(commissionAmount.toFixed(2)),
              appliedRule: applicableRule.nombre,
            });
          }
        }
      }
      if (receiptTotalCommission > 0) {
        sellerReport.totalCommission += receiptTotalCommission;
        sellerReport.totalSales += Number(sale.total);
        sellerReport.details.push({
          receiptId: sale.idComprobante,
          receiptSerie: `${sale.serie}-${sale.numero}`,
          date: sale.fecEmision,
          items: receiptCommissions,
        });
      }
    }
    return Array.from(reportMap.values());
  }
  private calculateItemCommission(item: any, rule: CommissionRule): number {
    if (rule.tipo_recompensa === CommissionRewardType.MONTO_FIJO) {
      return rule.valor_recompensa * item.quantity;
    }
    const itemTotal =
      Number(item.total) || Number(item.unitPrice) * item.quantity;
    return itemTotal * (rule.valor_recompensa / 100);
  }
}
