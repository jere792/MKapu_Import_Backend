import { Empresa } from '../../entity/empresa.entity';

export interface GetEmpresaPort {
  execute(): Promise<Empresa | null>;
}
export const GET_EMPRESA_USE_CASE = 'GET_EMPRESA_USE_CASE';
