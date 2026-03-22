import { Inject, Injectable } from '@nestjs/common';
import {
  COMMISSION_REPOSITORY,
  ICommissionRepositoryPortOut,
  IQueryCommissionRepositoryPortOut,
} from '../../domain/ports/out/commission-repository.port';
import { ISalesReceiptQueryPort } from '../../../sales-receipt/domain/ports/in/sales_receipt-ports-in';
import { CommissionReportItem } from '../dto/out/commision-report.dto-out';
import { CommissionReportFlat } from '../dto/out/commission-report-flat.dto';
import { ReceiptStatus } from '../../../sales-receipt/domain/entity/sales-receipt-domain-entity';
import { SalesReceiptResponseDto } from '../../../sales-receipt/application/dto/out/sales-receipt-response.dto';
import {
  CommissionRewardType,
  CommissionRule,
  CommissionTargetType,
} from '../../domain/entity/commission-rule.entity';
import { UsersTcpProxy } from '../../../sales-receipt/infrastructure/adapters/out/TCP/users-tcp.proxy';
import { SedeTcpProxy }  from '../../../sales-receipt/infrastructure/adapters/out/TCP/sede-tcp.proxy';

@Injectable()
export class CommissionQueryService implements IQueryCommissionRepositoryPortOut {
  constructor(
    @Inject(COMMISSION_REPOSITORY)
    private readonly repository: ICommissionRepositoryPortOut,
    @Inject('ISalesReceiptQueryPort')
    private readonly salesRepo: ISalesReceiptQueryPort,
    private readonly usersTcpProxy: UsersTcpProxy,
    private readonly sedeTcpProxy:  SedeTcpProxy,
  ) {}

  async getAllRules() {
    return this.repository.findAll(false);
  }

  async getUsageByRule() {
    return this.repository.getUsageByRule();
  }

  async getReport(from: Date, to: Date): Promise<CommissionReportFlat[]> {
    // ← usa findByDateRangeWithSede para obtener id_sede en una sola query
    const commissions = await this.repository.findByDateRangeWithSede(from, to);
    if (!commissions.length) return [];

    // 1. Nombres de vendedores via TCP
    const vendedorIds = [...new Set(commissions.map(c => c.id_vendedor_ref))];
    let nombresMap: Record<string, string> = {};
    try {
      const usuarios = await this.usersTcpProxy.findByIds(
        vendedorIds.map(id => Number(id)),
      );
      nombresMap = Object.fromEntries(
        usuarios.map((u: any) => [String(u.id_usuario), u.nombreCompleto]),
      );
    } catch {
      // fallback: muestra ID
    }

    // 2. Nombres de sedes via TCP — una llamada por sede única (no por comprobante)
    const sedeIds = [...new Set(commissions.map(c => (c as any)._id_sede as number).filter(Boolean))];
    const sedeNombres: Record<number, string> = {};
    for (const idSede of sedeIds) {
      try {
        const sedeData = await this.sedeTcpProxy.getSedeById(idSede);
        sedeNombres[idSede] = sedeData?.nombre ?? `Sede #${idSede}`;
      } catch {
        sedeNombres[idSede] = `Sede #${idSede}`;
      }
    }

    // 3. Ensamblar respuesta plana
    return commissions.map(c => {
      const idSede = (c as any)._id_sede as number ?? 0;
      return {
        id_comision:       c.id_comision!,
        id_vendedor_ref:   c.id_vendedor_ref,
        nombre_vendedor:   nombresMap[c.id_vendedor_ref] ?? `Vendedor #${c.id_vendedor_ref}`,
        id_comprobante:    c.id_comprobante,
        id_sede:           idSede,
        nombre_sede:       sedeNombres[idSede] ?? '—',
        porcentaje:        c.porcentaje,
        monto:             c.monto,
        estado:            c.estado,
        fecha_registro:    c.fecha_registro,
        fecha_liquidacion: c.fecha_liquidacion,
        id_regla:          c.id_regla,
      };
    });
  }

  async calculateCommissions(startDate: Date, endDate: Date): Promise<CommissionReportItem[]> {
    const rules = await this.repository.findAll(true);
    if (!rules.length) return [];

    const salesResponse = await this.salesRepo.listReceipts({
      status:   ReceiptStatus.EMITIDO,
      dateFrom: startDate,
      dateTo:   endDate,
    });

    const sales: SalesReceiptResponseDto[] = salesResponse.receipts;
    const reportMap = new Map<string, CommissionReportItem>();

    for (const sale of sales) {
      const sellerId = sale.idResponsableRef;
      if (!reportMap.has(sellerId))
        reportMap.set(sellerId, { sellerId, totalCommission: 0, totalSales: 0, details: [] });

      const sellerReport = reportMap.get(sellerId)!;
      let receiptTotalCommission = 0;
      const receiptCommissions: any[] = [];

      for (const item of sale.items) {
        const applicableRule = rules.find(
          r =>
            r.tipo_objetivo === CommissionTargetType.PRODUCTO &&
            r.id_objetivo   === Number(item.productId) &&
            r.esVigente(new Date(sale.fecEmision)),
        );
        if (applicableRule && item.quantity >= applicableRule.meta_unidades) {
          const amount = this.calculateItemCommission(item, applicableRule);
          if (amount > 0) {
            receiptTotalCommission += amount;
            receiptCommissions.push({
              productName:      item.productName,
              quantity:         item.quantity,
              commissionEarned: Number(amount.toFixed(2)),
              appliedRule:      applicableRule.nombre,
            });
          }
        }
      }

      if (receiptTotalCommission > 0) {
        sellerReport.totalCommission += receiptTotalCommission;
        sellerReport.totalSales      += Number(sale.total);
        sellerReport.details.push({
          receiptId:    sale.idComprobante,
          receiptSerie: `${sale.serie}-${sale.numero}`,
          date:         sale.fecEmision,
          items:        receiptCommissions,
        });
      }
    }

    return Array.from(reportMap.values());
  }

  private calculateItemCommission(item: any, rule: CommissionRule): number {
    if (rule.tipo_recompensa === CommissionRewardType.MONTO_FIJO)
      return rule.valor_recompensa * item.quantity;
    const base = Number(item.total) || Number(item.unitPrice) * item.quantity;
    return base * (rule.valor_recompensa / 100);
  }
}