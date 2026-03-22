import { Empresa } from 'apps/administration/src/core/company/domain/entity/empresa.entity';

export interface EmpresaPortOut {
  getEmpresa(id: number): Promise<Empresa>;
}
