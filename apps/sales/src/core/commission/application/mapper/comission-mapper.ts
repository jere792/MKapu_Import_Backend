/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CommissionRule,
  CommissionRuleProps,
} from '../../domain/entity/commission-rule.entity';
import { CommissionRuleOrmEntity } from '../../infrastructure/entity/commission-rule-orm.entity';

export class ComissionMapper {
  public static toOrm(domain: CommissionRule): CommissionRuleOrmEntity {
    const entity = new CommissionRuleOrmEntity();
    if (domain.id_regla) {
      entity.id_regla = domain.id_regla;
    }
    entity.nombre = domain.nombre;
    entity.descripcion = domain.descripcion || '';
    entity.tipo_objetivo = domain.tipo_objetivo;
    entity.id_objetivo = domain.id_objetivo;
    entity.meta_unidades = domain.meta_unidades;
    entity.tipo_recompensa = domain.tipo_recompensa;
    entity.valor_recompensa = domain.valor_recompensa;
    entity.activo = domain.activo;
    entity.fecha_inicio = domain.fecha_inicio;
    entity.fecha_fin = domain.fecha_fin || null;

    return entity;
  }
  public static toDomain(orm: CommissionRuleOrmEntity): CommissionRule {
    const props: CommissionRuleProps = {
      id_regla: orm.id_regla,
      nombre: orm.nombre,
      descripcion: orm.descripcion,
      tipo_objetivo: orm.tipo_objetivo,
      id_objetivo: orm.id_objetivo,
      meta_unidades: orm.meta_unidades,
      tipo_recompensa: orm.tipo_recompensa,
      valor_recompensa: Number(orm.valor_recompensa), // Asegurar conversión de string decimal a number
      activo: orm.activo,
      fecha_inicio: orm.fecha_inicio,
      fecha_fin: orm.fecha_fin,
    };
    return CommissionRule.create(props);
  }
}
