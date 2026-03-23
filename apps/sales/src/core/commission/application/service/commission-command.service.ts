// src/commission/application/service/commission-command.service.ts

import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  CommissionRule,
  CommissionRewardType,
  CommissionTargetType,
} from '../../domain/entity/commission-rule.entity';
import {
  Commission,
  CommissionStatus,
} from '../../domain/entity/commission-domain-entity';
import { CreateCommissionRuleDto } from '../dto/in/create-commission-rule.dto';
import {
  COMMISSION_REPOSITORY,
  ICommissionRepositoryPortOut,
} from '../../domain/ports/out/commission-repository.port';
import {
  GenerateCommissionPayload,
  ICommandCommissionRepositoryPortIn,
} from '../../domain/ports/in/comission-repository.port-in';

@Injectable()
export class CommissionCommandService implements ICommandCommissionRepositoryPortIn {
  constructor(
    @Inject(COMMISSION_REPOSITORY)
    private readonly repository: ICommissionRepositoryPortOut,
  ) {}

  // ── Reglas ───────────────────────────────────────────────────────────────

  async createRule(dto: CreateCommissionRuleDto): Promise<CommissionRule> {
    const rule = new CommissionRule({
      ...dto,
      activo: true,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
    });
    return this.repository.save(rule);
  }

  /** Actualiza todos los campos de una regla existente (PUT) */
  async updateRule(
    id: number,
    dto: CreateCommissionRuleDto,
  ): Promise<CommissionRule> {
    return this.repository.update(id, {
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      tipo_objetivo: dto.tipo_objetivo,
      id_objetivo: dto.id_objetivo,
      meta_unidades: dto.meta_unidades,
      tipo_recompensa: dto.tipo_recompensa,
      valor_recompensa: dto.valor_recompensa,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
    });
  }

  async atenderCommission(id: number): Promise<Commission> {
    const commission = await this.repository.findCommissionById(id);
    if (!commission)
      throw new NotFoundException(`Comisión #${id} no encontrada`);
    const liquidada = commission.liquidar();
    return this.repository.saveCommission(liquidada);
  }

  async toggleStatus(id: number, activo: boolean): Promise<CommissionRule> {
    return this.repository.update(id, { activo });
  }

  async generateFromReceipt(
    payload: GenerateCommissionPayload,
  ): Promise<Commission | null> {
    const rules = await this.repository.findAll(true);
    if (!rules.length) return null;

    const fec = new Date(payload.fec_emision);
    const vigentes = rules.filter((r) => r.esVigente(fec));
    if (!vigentes.length) return null;

    let montoTotal = 0;
    let reglaAplicada: CommissionRule | null = null;

    for (const item of payload.items) {
      let regla = vigentes.find(
        (r) =>
          r.tipo_objetivo === CommissionTargetType.PRODUCTO &&
          r.id_objetivo === item.productId &&
          item.quantity >= r.meta_unidades,
      );

      if (!regla && item.categoryId !== undefined) {
        regla = vigentes.find(
          (r) =>
            r.tipo_objetivo === CommissionTargetType.CATEGORIA &&
            r.id_objetivo === item.categoryId &&
            item.quantity >= r.meta_unidades,
        );
      }

      if (regla) {
        montoTotal += this.calcularPorItem(item, regla);
        reglaAplicada = reglaAplicada ?? regla;
      }
    }

    if (montoTotal <= 0 || !reglaAplicada) return null;

    const comision = Commission.create({
      id_vendedor_ref: payload.id_responsable_ref,
      id_comprobante: payload.id_comprobante,
      porcentaje: reglaAplicada.valor_recompensa,
      monto: +montoTotal.toFixed(2),
      estado: CommissionStatus.PENDIENTE,
      fecha_registro: new Date(),
      id_regla: reglaAplicada.id_regla,
    });

    return this.repository.saveCommission(comision);
  }

  // ── Anulación al anular comprobante ──────────────────────────────────────

  async annulByReceipt(id_comprobante: number): Promise<void> {
    const comision =
      await this.repository.findCommissionByReceipt(id_comprobante);
    if (!comision) return;
    const anulada = comision.anular();
    await this.repository.saveCommission(anulada);
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private calcularPorItem(
    item: GenerateCommissionPayload['items'][number],
    rule: CommissionRule,
  ): number {
    if (rule.tipo_recompensa === CommissionRewardType.MONTO_FIJO) {
      return +(rule.valor_recompensa * item.quantity).toFixed(2);
    }
    const base = item.total || item.unitPrice * item.quantity;
    return +(base * (rule.valor_recompensa / 100)).toFixed(2);
  }
}
