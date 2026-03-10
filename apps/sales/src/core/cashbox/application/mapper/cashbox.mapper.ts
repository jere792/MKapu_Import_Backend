import { Cashbox } from "../../domain/entity/cashbox-domain-entity";
import { CashboxOrmEntity } from "../../infrastructure/entity/cashbox-orm.entity";
import { CashboxResponseDto } from "../dto/out";

export class CashboxMapper {
  static toResponseDto(domain: Cashbox): CashboxResponseDto {
    return {
      id_caja:       domain.id_caja,
      id_sede_ref:   domain.id_sede_ref,
      estado:        domain.estado,
      fec_apertura:  domain.fec_apertura,
      fec_cierre:    domain.fec_cierre ?? null,
      monto_inicial: domain.monto_inicial ?? null, 
    };
  }

  static toOrmEntity(domain: Cashbox): CashboxOrmEntity {
    const orm = new CashboxOrmEntity();
    orm.id_caja       = domain.id_caja;
    orm.id_sede_ref   = domain.id_sede_ref;
    orm.estado        = domain.estado;
    orm.fec_apertura  = domain.fec_apertura;
    orm.fec_cierre    = domain.fec_cierre ?? null;
    orm.monto_inicial = domain.monto_inicial ?? null; 
    return orm;
  }

  static generateId(idSede: number): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `CJ-${idSede}-${date}-${Math.floor(Math.random() * 1000)}`;
  }
}