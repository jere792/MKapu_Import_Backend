// src/commission/infrastructure/adapters/out/repository/commission.repository.ts

/* eslint-disable @typescript-eslint/unbound-method */
import { Injectable } from '@nestjs/common';
import { ICommissionRepositoryPortOut } from '../../../../domain/ports/out/commission-repository.port';
import {
  CommissionRule,
  CommissionTargetType,
} from '../../../../domain/entity/commission-rule.entity';
import {
  Commission,
  CommissionStatus,
} from '../../../../domain/entity/commission-domain-entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CommissionRuleOrmEntity } from '../../../entity/commission-rule-orm.entity';
import { CommissionOrmEntity }     from '../../../entity/commission-orm.entity';
import { In, Repository }          from 'typeorm';
import { ComissionMapper }         from '../../../../application/mapper/comission-mapper';

@Injectable()
export class CommissionRepository implements ICommissionRepositoryPortOut {
  constructor(
    @InjectRepository(CommissionRuleOrmEntity)
    private readonly ruleRepo: Repository<CommissionRuleOrmEntity>,

    @InjectRepository(CommissionOrmEntity)
    private readonly commissionRepo: Repository<CommissionOrmEntity>,
  ) {}

  // ── Reglas ────────────────────────────────────────────────────────────────

  async save(rule: CommissionRule): Promise<CommissionRule> {
    const saved = await this.ruleRepo.save(ComissionMapper.toOrm(rule));
    return ComissionMapper.toDomain(saved);
  }

  async findById(id_regla: number): Promise<CommissionRule | null> {
    const entity = await this.ruleRepo.findOne({ where: { id_regla } });
    return entity ? ComissionMapper.toDomain(entity) : null;
  }

  async findAll(activeOnly: boolean): Promise<CommissionRule[]> {
    const where = activeOnly ? { activo: true } : {};
    const entities = await this.ruleRepo.find({ where });
    return entities.map(ComissionMapper.toDomain);
  }

  async update(id: number, partial: Partial<CommissionRule>): Promise<CommissionRule> {
    await this.ruleRepo.update(id, partial);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.ruleRepo.delete(id);
  }

  async findApplicableRules(
    productIds: number[],
    categoryIds: number[],
  ): Promise<CommissionRule[]> {
    return (
      await this.ruleRepo.find({
        where: [
          { tipo_objetivo: CommissionTargetType.PRODUCTO,  id_objetivo: In(productIds),  activo: true },
          { tipo_objetivo: CommissionTargetType.CATEGORIA, id_objetivo: In(categoryIds), activo: true },
        ],
      })
    ).map(ComissionMapper.toDomain);
  }

  // ── Comisiones individuales ───────────────────────────────────────────────

  async saveCommission(commission: Commission): Promise<Commission> {
    const orm = this.commissionRepo.create({
      id_comision:       commission.id_comision,
      id_vendedor_ref:   commission.id_vendedor_ref,
      id_comprobante:    commission.id_comprobante,
      porcentaje:        commission.porcentaje,
      monto:             commission.monto,
      estado:            commission.estado,
      fecha_liquidacion: commission.fecha_liquidacion,
      id_regla:          commission.id_regla,
    });
    const saved = await this.commissionRepo.save(orm);
    return this.ormToDomain(saved);
  }

  async findCommissionByReceipt(id_comprobante: number): Promise<Commission | null> {
    const orm = await this.commissionRepo.findOne({ where: { id_comprobante } });
    return orm ? this.ormToDomain(orm) : null;
  }

  async annulCommission(id_comprobante: number): Promise<void> {
    await this.commissionRepo.update(
      { id_comprobante },
      { estado: CommissionStatus.ANULADA },
    );
  }

  /**
   * Registros reales de comisión en un rango de fechas.
   * Usado por el endpoint GET /commissions/report.
   */
  async findByDateRange(from: Date, to: Date): Promise<Commission[]> {
    // Ajusta la fecha fin al final del día para incluir registros del día "to"
    const toEndOfDay = new Date(to);
    toEndOfDay.setHours(23, 59, 59, 999);

    const rows = await this.commissionRepo
      .createQueryBuilder('c')
      .where('c.fecha_registro >= :from',    { from })
      .andWhere('c.fecha_registro <= :to',   { to: toEndOfDay })
      .orderBy('c.fecha_registro', 'DESC')
      .getMany();

    return rows.map(c => this.ormToDomain(c));
  }

  /**
   * Uso de cada regla: total de comisiones generadas y monto acumulado.
   * Excluye comisiones ANULADAS.
   */
  async getUsageByRule(): Promise<{ id_regla: number; usos: number; monto_total: number }[]> {
    const rows = await this.commissionRepo
      .createQueryBuilder('c')
      .select('c.id_regla',           'id_regla')
      .addSelect('COUNT(c.id_comision)', 'usos')
      .addSelect('SUM(c.monto)',         'monto_total')
      .where('c.estado != :estado', { estado: CommissionStatus.ANULADA })
      .andWhere('c.id_regla IS NOT NULL')
      .groupBy('c.id_regla')
      .getRawMany();

    return rows.map(r => ({
      id_regla:    Number(r.id_regla),
      usos:        Number(r.usos),
      monto_total: Number(r.monto_total ?? 0),
    }));
  }

  // ── Mapper privado ORM → dominio ──────────────────────────────────────────

  private ormToDomain(orm: CommissionOrmEntity): Commission {
    return Commission.create({
      id_comision:       orm.id_comision,
      id_vendedor_ref:   orm.id_vendedor_ref,
      id_comprobante:    orm.id_comprobante,
      porcentaje:        Number(orm.porcentaje),
      monto:             Number(orm.monto),
      estado:            orm.estado,
      fecha_registro:    orm.fecha_registro,
      fecha_liquidacion: orm.fecha_liquidacion,
      id_regla:          orm.id_regla,
    });
  }

  async findCommissionById(id_comision: number): Promise<Commission | null> {
  const orm = await this.commissionRepo.findOne({ where: { id_comision } });
  return orm ? this.ormToDomain(orm) : null;
  }

  async findByDateRangeWithSede(from: Date, to: Date): Promise<(Commission & { id_sede: number })[]> {
  const toEndOfDay = new Date(to);
  toEndOfDay.setHours(23, 59, 59, 999);

    const rows = await this.commissionRepo
      .createQueryBuilder('c')
      .leftJoin('comprobante_venta', 'cv', 'cv.id_comprobante = c.id_comprobante')
      .addSelect('cv.id_sede_ref', 'id_sede')
      .where('c.fecha_registro >= :from', { from })
      .andWhere('c.fecha_registro <= :to', { to: toEndOfDay })
      .orderBy('c.fecha_registro', 'DESC')
      .getRawAndEntities();

    return rows.entities.map((orm, i) => {
      const domain = this.ormToDomain(orm) as any;
      domain._id_sede = Number(rows.raw[i]?.id_sede ?? 0);
      return domain;
    });
  }
}