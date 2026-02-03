/* administration/src/core/cashbox/domain/ports/out/cashbox-ports-out.ts */
import { Cashbox } from "../../entity/cashbox-domain-entity";

export interface ICashboxRepositoryPort {
  // Cambiamos CashboxOrmEntity por Cashbox en los contratos
  save(cashbox: Cashbox): Promise<Cashbox>;
  update(cashbox: Cashbox): Promise<Cashbox>;
  findById(id_caja: string): Promise<Cashbox | null>;
  findActiveBySede(id_sede_ref: number): Promise<Cashbox | null>;
  existsActiveInSede(id_sede_ref: number): Promise<boolean>;
}